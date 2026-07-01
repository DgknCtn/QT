"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { PrepFormData } from "./types";
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
    where: { userId, dateTime: { gte: start, lte: end } },
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

async function ensureUser(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: user?.email ?? "",
      name: user?.user_metadata?.name ?? null,
    },
  });
}

export async function updateDailyPrep(prepId: string, userId: string, data: PrepFormData): Promise<void> {
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
      activeMicroCycle: e(data.activeMicroCycle) ?? null,
      q1Quality: e(data.q1Quality) ?? null,
      expectedBehavior: e(data.expectedBehavior) ?? null,
      trueOpenSummary: data.trueOpens as object,
      dfrSummary: data.dfr as object,
      ssmtSummary: data.ssmt as object,
      confirmationSummary: data.confirmation as object,
      newsSummary: { events: data.newsEvents } as object,
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

export async function saveDailyPrep(userId: string, data: PrepFormData): Promise<void> {
  await ensureUser(userId);

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
      activeMicroCycle: e(data.activeMicroCycle) ?? null,
      q1Quality: e(data.q1Quality) ?? null,
      expectedBehavior: e(data.expectedBehavior) ?? null,
      trueOpenSummary: data.trueOpens as object,
      dfrSummary: data.dfr as object,
      ssmtSummary: data.ssmt as object,
      confirmationSummary: data.confirmation as object,
      newsSummary: { events: data.newsEvents } as object,
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
