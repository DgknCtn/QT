"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertValidTrade } from "@/lib/schemas/trade";

export async function deleteTrade(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.trade.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/journal");
}

function e<T>(v: string | undefined): T | undefined {
  return v && v.trim() !== "" ? (v as unknown as T) : undefined;
}

function computeProcessScore(form: Record<string, unknown>, mistakeTags: string[]): { score: number; grade: string } {
  let s = 0;
  if (form.dailyPrepId) s += 2;
  if (form.setupType && form.setupType !== "CUSTOM") s += 2;
  if (form.entryPrice && form.stopPrice) s += 1;
  if (form.tp1) s += 1;
  if (form.riskPercent) s += 1;
  if (form.goStatusAtEntry === "GO") s += 2;
  if (form.planFollowed === "YES") s += 2;

  if (mistakeTags.includes("FOMO")) s -= 2;
  if (!form.stopPrice) s -= 5;
  if (!form.tp1 && form.result === "WIN") s -= 1;
  if (form.goStatusAtEntry === "NO_GO_BUT_ENTERED") s -= 3;
  if (mistakeTags.includes("News ignored")) s -= 3;
  if (mistakeTags.includes("No HTF narrative")) s -= 2;
  if (mistakeTags.includes("Wrong TF alignment")) s -= 2;

  const grade =
    s >= 10 ? "A_PLUS" :
    s >= 6  ? "B" :
    s >= 3  ? "C" :
    "RULE_BREAK";

  return { score: s, grade };
}

export async function updateTrade(
  tradeId: string,
  userId: string,
  form: Record<string, unknown>,
  newScreenshots: { url: string; type: string }[]
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("Not authenticated");

  const existing = await prisma.trade.findFirst({ where: { id: tradeId, userId } });
  if (!existing) throw new Error("Trade not found");

  assertValidTrade(form);

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
      dailyPrepId: (form.dailyPrepId as string) || null,
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
