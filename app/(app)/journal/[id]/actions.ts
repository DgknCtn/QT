"use server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertValidTrade } from "@/lib/schemas/trade";
import { computeProcessScore } from "@/lib/journal/process-score";
import { assertOwnsDailyPrep } from "@/lib/auth/assert-owns";

export async function deleteTrade(id: string) {
  const userId = await requireUserId();

  await prisma.trade.deleteMany({ where: { id, userId } });
  revalidatePath("/journal");
}

function e<T>(v: string | undefined): T | undefined {
  return v && v.trim() !== "" ? (v as unknown as T) : undefined;
}


export async function updateTrade(
  tradeId: string,
  form: Record<string, unknown>,
  newScreenshots: { url: string; type: string }[]
): Promise<void> {
  const userId = await requireUserId();

  const existing = await prisma.trade.findFirst({ where: { id: tradeId, userId } });
  if (!existing) throw new Error("Trade not found");

  assertValidTrade(form);

  // Bagli prep'in bu kullaniciya ait oldugu, iliski kurulmadan once dogrulanir.
  const ownedPrepId = await assertOwnsDailyPrep(userId, form.dailyPrepId as string | undefined);

  const mistakeTags = (form.mistakeTags as string[]) ?? [];
  const positiveTags = (form.positiveTags as string[]) ?? [];
  const { score, grade } = computeProcessScore(form, mistakeTags);

  await prisma.trade.update({
    where: { id: tradeId },
    data: {
      date: new Date(form.date as string),
      instrument: (form.instrument as string) || "UNKNOWN",
      marketGroup: e(form.marketGroup as string) ?? "INDICES",
      triad: e(form.triad as string) ?? "NQ_ES_YM",
      session: e(form.session as string) ?? "NY_AM",
      direction: e(form.direction as string) ?? "LONG",
      setupType: e(form.setupType as string) ?? "CUSTOM",
      entryModel: e(form.entryModel as string) ?? "NO_ENTRY",
      entryPrice: form.entryPrice ? parseFloat(form.entryPrice as string) : null,
      stopPrice: form.stopPrice ? parseFloat(form.stopPrice as string) : null,
      tp1: form.tp1 ? parseFloat(form.tp1 as string) : null,
      tp2: form.tp2 ? parseFloat(form.tp2 as string) : null,
      tp3: form.tp3 ? parseFloat(form.tp3 as string) : null,
      riskPercent: form.riskPercent ? parseFloat(form.riskPercent as string) : null,
      rResult: form.rResult ? parseFloat(form.rResult as string) : null,
      pnlPoints: form.pnlPoints ? parseFloat(form.pnlPoints as string) : null,
      pnlCurrency: form.pnlCurrency ? parseFloat(form.pnlCurrency as string) : null,
      result: e(form.result as string) ?? "NO_TRADE",
      processScore: score,
      processGrade: grade as "A_PLUS" | "B" | "C" | "RULE_BREAK" | "UNREVIEWED",
      planFollowed: e(form.planFollowed as string) ?? null,
      goStatusAtEntry: e(form.goStatusAtEntry as string) ?? null,
      dailyPrepId: ownedPrepId,
      notes: (form.notes as string) || null,
    },
  });

  // Replace tags
  await prisma.tradeTag.deleteMany({ where: { tradeId } });
  const allTags = [
    ...mistakeTags.map((name) => ({ name, category: "MISTAKE" as const })),
    ...positiveTags.map((name) => ({ name, category: "POSITIVE" as const })),
  ];
  for (const { name, category } of allTags) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name, category },
    });
    await prisma.tradeTag.create({ data: { tradeId, tagId: tag.id } });
  }

  // Append new screenshots
  for (const { url, type } of newScreenshots) {
    await prisma.screenshot.create({
      data: {
        userId,
        tradeId,
        fileUrl: url,
        screenshotType: type as "HTF_CONTEXT" | "ENTRY" | "EXIT" | "MISSED_SETUP" | "REVIEW",
      },
    });
  }

  revalidatePath(`/journal/${tradeId}`);
  revalidatePath("/journal");
  revalidatePath("/dashboard");
}
