"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseTradovateCsv } from "./parse-tradovate";
import { parseBinanceFuturesCsv } from "./parse-binance-futures";
import { parseOkxCsv } from "./parse-okx";
import type { ParsedTradeRow, ParseResult, BrokerSource } from "@/lib/broker/parsed-row";
import { importPayloadSchema } from "@/lib/broker/parsed-row-schema";
import { FormValidationError } from "@/lib/schemas/form";
import { rankMatchCandidates, type ScoredCandidate } from "@/lib/broker/match";
import { assertOwnsBrokerTrade, assertOwnsTrade } from "@/lib/auth/assert-owns";

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

/**
 * Önizlemede seçilen pozisyonları kaydeder.
 *
 * `rows` istemciden geliyor — ayrıştırma ayrı bir action'da yapıldığı için
 * bu satırlar parser'ın ürettikleriyle aynı olmak zorunda değil. Bu yüzden
 * kaydetmeden önce yeniden doğrulanıyorlar; `userId` zaten oturumdan geliyor.
 */
export async function commitImport(rows: ParsedTradeRow[]): Promise<{ imported: number; skipped: number }> {
  const userId = await requireUserId();

  const parsed = importPayloadSchema.safeParse(rows);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.length ? ` (${first.path.join(".")})` : "";
    throw new FormValidationError(`İçe aktarma verisi geçersiz${where}: ${first?.message ?? "bilinmeyen hata"}`);
  }

  const result = await prisma.brokerTrade.createMany({
    data: parsed.data.map((r) => ({
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

// ─── Journal eşleştirme ─────────────────────────────────────────────────────

/**
 * Bu broker pozisyonuna bağlanabilecek journal kayıtları, en olası önce.
 *
 * Şemadaki `BrokerTrade.tradeId` baştan beri vardı ama onu kuran bir akış
 * yoktu: plan ile gerçek sonuç birbirini hiç görmüyordu.
 */
export async function getMatchCandidates(brokerTradeId: string): Promise<ScoredCandidate[]> {
  const userId = await requireUserId();

  const broker = await prisma.brokerTrade.findFirst({
    where: { id: brokerTradeId, userId },
    select: { instrument: true, direction: true, entryTime: true },
  });
  if (!broker) throw new Error("Pozisyon bulunamadı.");

  // Pencere bilerek geniş: kullanıcı journal kaydının tarihini işlem
  // gününden farklı girmiş olabilir. Eleme değil sıralama yapıyoruz.
  const from = new Date(broker.entryTime);
  from.setDate(from.getDate() - 3);
  const to = new Date(broker.entryTime);
  to.setDate(to.getDate() + 3);

  const candidates = await prisma.trade.findMany({
    where: { userId, date: { gte: from, lte: to } },
    select: { id: true, date: true, instrument: true, direction: true, setupType: true, result: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  return rankMatchCandidates(broker, candidates);
}

/**
 * Broker pozisyonunu bir journal kaydına bağlar (veya `null` ile bağı koparır).
 *
 * Her iki tarafın sahipliği ayrı ayrı doğrulanır: `brokerTrade` filtresi
 * `tradeId`'yi korumaz — bkz. lib/auth/assert-owns.ts.
 */
export async function linkBrokerTradeToJournal(
  brokerTradeId: string,
  tradeId: string | null,
): Promise<void> {
  const userId = await requireUserId();

  await assertOwnsBrokerTrade(userId, brokerTradeId);
  const ownedTradeId = await assertOwnsTrade(userId, tradeId);

  await prisma.brokerTrade.updateMany({
    where: { id: brokerTradeId, userId },
    data: { tradeId: ownedTradeId },
  });

  revalidatePath("/trade-log");
  revalidatePath(`/trade-log/${brokerTradeId}`);
  revalidatePath("/analytics");
}
