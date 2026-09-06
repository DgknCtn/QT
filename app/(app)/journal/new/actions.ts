"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { assertValidTrade } from "@/lib/schemas/trade";
import { computeProcessScore } from "@/lib/journal/process-score";
import { assertOwnsDailyPrep } from "@/lib/auth/assert-owns";

function e<T>(v: string | undefined): T | undefined {
  return v && v.trim() !== "" ? (v as unknown as T) : undefined;
}


export async function saveTrade(
  form: Record<string, unknown>,
  screenshots: { url: string; type: string }[]
): Promise<void> {
  // userId is derived from the session, never accepted from the caller --
  // otherwise a client could write trades into someone else's journal.
  const { id: userId } = await ensureUser();
  assertValidTrade(form);

  // Bagli prep'in bu kullaniciya ait oldugu, iliski kurulmadan once dogrulanir.
  // Trade'in kendi userId filtresi bu iliskiyi korumuyor.
  const ownedPrepId = await assertOwnsDailyPrep(userId, form.dailyPrepId as string | undefined);

  const mistakeTags = (form.mistakeTags as string[]) ?? [];
  const positiveTags = (form.positiveTags as string[]) ?? [];
  const { score, grade } = computeProcessScore(form, mistakeTags);

  await prisma.$transaction(async (tx) => {
  const trade = await tx.trade.create({
    data: {
      userId,
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

  // Save tags
  const allTags = [
    ...mistakeTags.map((name) => ({ name, category: "MISTAKE" as const })),
    ...positiveTags.map((name) => ({ name, category: "POSITIVE" as const })),
  ];

  for (const { name, category } of allTags) {
    const tag = await tx.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name, category },
    });
    await tx.tradeTag.create({ data: { tradeId: trade.id, tagId: tag.id } });
  }

  // Save screenshots
  for (const { url, type } of screenshots) {
    await tx.screenshot.create({
      data: {
        userId,
        tradeId: trade.id,
        fileUrl: url,
        screenshotType: type as "HTF_CONTEXT" | "ENTRY" | "EXIT" | "MISSED_SETUP" | "REVIEW",
      },
    });
  }
  });

  revalidatePath("/journal");
  revalidatePath("/dashboard");
}
