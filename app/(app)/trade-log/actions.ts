"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseTradovateCsv, type ParsedTradeRow } from "./parse-tradovate";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function parseImportFile(csvText: string): Promise<{ rows: ParsedTradeRow[]; warnings: string[] }> {
  const userId = await requireUserId();
  return parseTradovateCsv(csvText, userId);
}

export async function commitImport(rows: ParsedTradeRow[]): Promise<{ imported: number; skipped: number }> {
  const userId = await requireUserId();

  const result = await prisma.brokerTrade.createMany({
    data: rows.map((r) => ({
      userId,
      source: r.source,
      account: r.account,
      instrument: r.instrument,
      direction: r.direction,
      quantity: r.quantity,
      entryPrice: r.entryPrice,
      exitPrice: r.exitPrice,
      entryTime: new Date(r.entryTime),
      exitTime: new Date(r.exitTime),
      durationSec: r.durationSec,
      grossPnl: r.grossPnl,
      commission: r.commission,
      fees: r.fees,
      netPnl: r.netPnl,
      externalRef: r.externalRef,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/trade-log");
  return { imported: result.count, skipped: rows.length - result.count };
}

export async function deleteBrokerTrade(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.brokerTrade.deleteMany({ where: { id, userId } });
  revalidatePath("/trade-log");
}

export async function updateBrokerTradeDetails(
  id: string,
  data: { riskUsd: number | null; journalNote: string | null; chartUrl: string | null }
): Promise<void> {
  const userId = await requireUserId();
  await prisma.brokerTrade.updateMany({
    where: { id, userId },
    data: {
      riskUsd: data.riskUsd,
      journalNote: data.journalNote,
      chartUrl: data.chartUrl,
    },
  });
  revalidatePath("/trade-log");
  revalidatePath(`/trade-log/${id}`);
}
