"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser, requireUserId } from "@/lib/auth";
import { economicEventScope } from "@/lib/economic-events";
import type { PrepFormData } from "./types";
import type { PrepCarryOver } from "@/lib/prep/carry-over";
import type { LevelType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type CalendarEventItem = {
  id: string;
  eventName: string;
  timeStr: string;
  currency: string;
  impact: string;
  userRiskTag: string | null;
};

export async function getCalendarEventsForDate(userId: string, date: Date): Promise<CalendarEventItem[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const events = await prisma.economicEvent.findMany({
    where: { ...economicEventScope(userId), dateTime: { gte: start, lte: end } },
    orderBy: { dateTime: "asc" },
  });

  return events.map((e) => ({
    id: e.id,
    eventName: e.eventName,
    timeStr: e.dateTime.toTimeString().slice(0, 5),
    currency: e.currency,
    impact: e.impact,
    userRiskTag: e.userRiskTag ?? null,
  }));
}

/**
 * "Son prep'ten kopyala" için yavaş değişen bağlamı getirir.
 *
 * "Dün" değil "en son": Pazartesi sabahı Cuma'nın prep'ini getirmeli.
 * Hangi alanların taşındığı `lib/prep/carry-over.ts`'te tek yerde tanımlı.
 */
export async function getLastPrepCarryOver(): Promise<PrepCarryOver | null> {
  const userId = await requireUserId();

  const last = await prisma.dailyPrep.findFirst({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      session: true,
      marketGroup: true,
      triad: true,
      primaryInstrument: true,
      secondaryInstruments: true,
      htfBias: true,
      htfBiasConfidence: true,
      htfInvalidation: true,
      htfBiasExplanation: true,
      weeklyPo3State: true,
      dailyPo3State: true,
      mmxmStage: true,
      mainLiquidityTarget: true,
      customLiqTarget: true,
    },
  });

  if (!last) return null;

  // Prisma enum'ları zaten string; form alanları da string tutuyor.
  return {
    session: last.session ?? "",
    marketGroup: last.marketGroup ?? "",
    triad: last.triad ?? "",
    primaryInstrument: last.primaryInstrument ?? "",
    secondaryInstruments: last.secondaryInstruments ?? [],
    htfBias: last.htfBias ?? "",
    htfBiasConfidence: last.htfBiasConfidence ?? "",
    htfInvalidation: last.htfInvalidation ?? "",
    htfBiasExplanation: last.htfBiasExplanation ?? "",
    weeklyPo3State: last.weeklyPo3State ?? "",
    dailyPo3State: last.dailyPo3State ?? "",
    mmxmStage: last.mmxmStage ?? "",
    mainLiquidityTarget: last.mainLiquidityTarget ?? "",
    customLiqTarget: last.customLiqTarget ?? "",
  };
}

/** Adım 5'in True Open fiyatlarını dolduracak kayıtlı seviyeler. */
export type TrueOpenLevel = { levelType: string; price: number; instrument: string };

const TRUE_OPEN_TYPES = ["TYO", "TMO", "TWO", "TDO", "TSO", "TMSO"] as const satisfies readonly LevelType[];

/**
 * Kullanıcının geçerli True Open seviyeleri, enstrümana göre gruplu.
 *
 * Enstrüman ancak Adım 1 doldurulunca belli olduğu için filtreleme sunucuda
 * değil istemcide yapılır: sonuç kümesi küçük (enstrüman × 6 tip), tek seferde
 * çekmek Adım 1 her değiştiğinde sunucuya gitmekten iyi.
 */
export async function getTrueOpenLevels(): Promise<Record<string, TrueOpenLevel[]>> {
  const userId = await requireUserId();
  const now = new Date();

  const levels = await prisma.level.findMany({
    where: {
      userId,
      levelType: { in: [...TRUE_OPEN_TYPES] },
      status: "ACTIVE",
      AND: [
        { OR: [{ dateValidFrom: null }, { dateValidFrom: { lte: now } }] },
        { OR: [{ dateValidTo: null }, { dateValidTo: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { levelType: true, price: true, instrument: true },
  });

  const byInstrument: Record<string, TrueOpenLevel[]> = {};
  for (const level of levels) {
    // Seviyeler kaydedilirken büyük harfe çevriliyor; karşılaştırma da öyle olsun.
    const key = level.instrument.toUpperCase();
    (byInstrument[key] ??= []).push({
      levelType: level.levelType,
      price: level.price,
      instrument: key,
    });
  }
  return byInstrument;
}

/**
 * Adım 4'teki "Disabled" seçeneği QuarterCycle enum'unda yok; `e()` körlemesine
 * cast ettiği için doğrudan Prisma'ya giderse kayıt runtime'da patlıyordu.
 */
function quarterOrNull(v: string | undefined) {
  const trimmed = v?.trim();
  if (!trimmed || trimmed === "DISABLED") return null;
  return e<"Q1" | "Q2" | "Q3" | "Q4">(trimmed) ?? null;
}

function parsePriceOrNull(v: string | undefined): number | null {
  const n = Number(v?.trim());
  return v?.trim() && Number.isFinite(n) ? n : null;
}

function e<T>(v: string | undefined): T | undefined {
  return v && v.trim() !== "" ? (v as unknown as T) : undefined;
}

function computeCompletionScore(data: PrepFormData): number {
  let score = 0;
  if (data.triad && data.primaryInstrument && data.session) score += 10;
  if (data.htfBias && data.htfBiasExplanation) score += 20;
  if (data.activeCycleWeekly && data.activeCycleDaily) score += 15;
  const toFilled = Object.values(data.trueOpens).filter((v) => v.price).length;
  if (toFilled >= 2) score += 15;
  if (data.dfr.dfrHigh && data.dfr.dfrLow) score += 10;
  if (data.ssmt.formed) score += 15;
  if (data.confirmation.confirmationType) score += 10;
  if (data.entry.riskPercent) score += 5;
  return Math.min(score, 100);
}

export async function updateDailyPrep(prepId: string, data: PrepFormData): Promise<void> {
  // Derive userId from the authenticated session, not a client-supplied argument.
  const userId = await requireUserId();

  const completionScore = computeCompletionScore(data);

  await prisma.dailyPrep.updateMany({
    where: { id: prepId, userId },
    data: {
      session: e(data.session) ?? "NY_AM",
      marketGroup: e(data.marketGroup) ?? "INDICES",
      triad: e(data.triad) ?? "NQ_ES_YM",
      primaryInstrument: data.primaryInstrument || "NQ",
      secondaryInstruments: data.secondaryInstruments,
      htfBias: e(data.htfBias) ?? "WAIT",
      htfBiasConfidence: e(data.htfBiasConfidence) ?? "MEDIUM",
      htfInvalidation: data.htfInvalidation || null,
      htfBiasExplanation: data.htfBiasExplanation || null,
      weeklyPo3State: e(data.weeklyPo3State) ?? "UNKNOWN",
      dailyPo3State: e(data.dailyPo3State) ?? "UNKNOWN",
      mmxmStage: e(data.mmxmStage) ?? "UNKNOWN",
      mainLiquidityTarget: e(data.mainLiquidityTarget) ?? null,
      customLiqTarget: data.customLiqTarget || null,
      activeCycleWeekly: e(data.activeCycleWeekly) ?? null,
      activeCycleDaily: e(data.activeCycleDaily) ?? null,
      active90mCycle: e(data.active90mCycle) ?? null,
      activeMicroCycle: quarterOrNull(data.activeMicroCycle),
      q1Quality: e(data.q1Quality) ?? null,
      expectedBehavior: e(data.expectedBehavior) ?? null,
      trueOpenSummary: data.trueOpens as object,
      dfrSummary: data.dfr as object,
      ssmtSummary: data.ssmt as object,
      confirmationSummary: data.confirmation as object,
      newsSummary: { events: data.newsEvents } as object,
      entrySummary: data.entry as object,
      currentPrice: parsePriceOrNull(data.currentPrice),
      goNoGoStatus: e(data.goNoGoStatus) ?? null,
      goNoGoReason: data.goNoGoReason || null,
      completionScore,
      isDraft: !data.goNoGoStatus,
      notes: data.notes || null,
    },
  });

  revalidatePath("/daily-prep");
  revalidatePath("/dashboard");
  revalidatePath(`/daily-prep/${prepId}`);
}

export async function saveDailyPrep(data: PrepFormData): Promise<void> {
  const { id: userId } = await ensureUser();

  const completionScore = computeCompletionScore(data);

  await prisma.dailyPrep.create({
    data: {
      userId,
      date: new Date(),
      session: e(data.session) ?? "NY_AM",
      marketGroup: e(data.marketGroup) ?? "INDICES",
      triad: e(data.triad) ?? "NQ_ES_YM",
      primaryInstrument: data.primaryInstrument || "NQ",
      secondaryInstruments: data.secondaryInstruments,
      htfBias: e(data.htfBias) ?? "WAIT",
      htfBiasConfidence: e(data.htfBiasConfidence) ?? "MEDIUM",
      htfInvalidation: data.htfInvalidation || null,
      htfBiasExplanation: data.htfBiasExplanation || null,
      weeklyPo3State: e(data.weeklyPo3State) ?? "UNKNOWN",
      dailyPo3State: e(data.dailyPo3State) ?? "UNKNOWN",
      mmxmStage: e(data.mmxmStage) ?? "UNKNOWN",
      mainLiquidityTarget: e(data.mainLiquidityTarget) ?? null,
      customLiqTarget: data.customLiqTarget || null,
      activeCycleWeekly: e(data.activeCycleWeekly) ?? null,
      activeCycleDaily: e(data.activeCycleDaily) ?? null,
      active90mCycle: e(data.active90mCycle) ?? null,
      activeMicroCycle: quarterOrNull(data.activeMicroCycle),
      q1Quality: e(data.q1Quality) ?? null,
      expectedBehavior: e(data.expectedBehavior) ?? null,
      trueOpenSummary: data.trueOpens as object,
      dfrSummary: data.dfr as object,
      ssmtSummary: data.ssmt as object,
      confirmationSummary: data.confirmation as object,
      newsSummary: { events: data.newsEvents } as object,
      entrySummary: data.entry as object,
      currentPrice: parsePriceOrNull(data.currentPrice),
      goNoGoStatus: e(data.goNoGoStatus) ?? null,
      goNoGoReason: data.goNoGoReason || null,
      completionScore,
      isDraft: !data.goNoGoStatus,
      notes: data.notes || null,
    },
  });

  revalidatePath("/daily-prep");
  revalidatePath("/dashboard");
}
