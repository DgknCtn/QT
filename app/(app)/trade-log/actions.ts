"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseTradovateCsv } from "./parse-tradovate";
import { parseBinanceFuturesCsv } from "./parse-binance-futures";
import { parseOkxCsv } from "./parse-okx";
import type { ParsedTradeRow, ParseResult, BrokerSource } from "@/lib/broker/parsed-row";

/**
 * CSV'yi seçilen brokera göre ayrıştırır. Henüz hiçbir şey kaydedilmez —
 * kullanıcı önizlemede satırları görüp onayladıktan sonra `commitImport`
 * çalışır.
 *
 * `utcOffset` kullanıcının elle seçtiği saat dilimi; boşsa her parser kendi
 * varsayılanına düşer. Kripto export'larının saatleri offset taşımadığı için
 * yanlış varsayım tüm çeyrek analizini kaydırır.
 */
export async function parseImportFile(
  csvText: string,
  source: BrokerSource = "TRADOVATE",
  utcOffset?: number
): Promise<ParseResult> {
  const userId = await requireUserId();

  switch (source) {
    case "BINANCE_FUTURES":
      // Binance saat dilimini hiçbir yere yazmaz; arayüz dosya adından tahmin
      // eder, o da tutmazsa UTC+3 varsayılır.
      return parseBinanceFuturesCsv(csvText, userId, utcOffset ?? 3);
    case "OKX":
      // OKX saat dilimini dosyanın içine yazar; buradaki değer yalnızca
      // kullanıcı arayüzden elle değiştirdiyse dolu gelir.
      return parseOkxCsv(csvText, utcOffset);
    default:
      return parseTradovateCsv(csvText, userId);
  }
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
      session: r.session,
      quarter90: r.quarter90,
      quarterMicro: r.quarterMicro,
      fundingFee: r.fundingFee,
      baseAsset: r.baseAsset,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/trade-log");
  revalidatePath("/binance-log");
  revalidatePath("/okx-log");
  return { imported: result.count, skipped: rows.length - result.count };
}

export async function deleteBrokerTrade(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.brokerTrade.deleteMany({ where: { id, userId } });
  revalidatePath("/trade-log");
  revalidatePath("/binance-log");
  revalidatePath("/okx-log");
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
  revalidatePath("/binance-log");
  revalidatePath("/okx-log");
  revalidatePath(`/trade-log/${id}`);
}
