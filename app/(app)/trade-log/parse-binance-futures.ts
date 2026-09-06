import Papa from "papaparse";
import type { Session, QuarterCycle } from "@prisma/client";
import { walkFlatToFlat, summarizeCycle } from "@/lib/broker/cycle-engine";
import { resolveQuarter, type QIndex } from "@/lib/market-clock/quarters";
import { toBaseAsset } from "@/lib/broker/symbols";
import type { ParsedTradeRow, ParseResult } from "@/lib/broker/parsed-row";

/** Binance USD-M futures'ta P&L ve bakiye bu birimde tutulur. */
const QUOTE_CURRENCY = "USDT";

// Testler tek yerden import edebilsin diye yeniden dışa veriliyor; asıl tanım
// client tarafından da kullanıldığı için ayrı dosyada.
export { guessUtcOffsetFromFilename } from "@/lib/broker/utc-offset";

/**
 * Binance Futures "Trade History" CSV'sini pozisyonlara çevirir.
 *
 * Beklenen başlıklar:
 *   Uid,Time,Symbol,Side,Price,Quantity,Amount,Fee,Realized Profit,
 *   Buyer,Maker,Trade ID,Order ID
 *
 * Tradovate parser'ından iki temel farkı var:
 *  1. Binance "Realized Profit" kolonunu veriyor, yani P&L kontrat çarpanından
 *     tahmin edilmiyor — doğrudan okunuyor.
 *  2. "Time" saat dilimi taşımıyor ("2026-08-30 22:46:50"). Offset dışarıdan
 *     verilmek zorunda; yanlış offset tüm çeyrek analizini kaydırır.
 */

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const satisfies readonly QuarterCycle[];

const SESSION_BY_NAME: Record<string, Session> = {
  London: "LONDON",
  "NY AM": "NY_AM",
  "NY PM": "NY_PM",
  Asia: "ASIA",
};

type BinanceFill = {
  uid: string;
  symbol: string;
  side: "Buy" | "Sell";
  qty: number;
  price: number;
  time: Date;
  fee: number;
  feeAsset: string;
  realizedProfit: number;
  tradeId: string;
};

/**
 * "2026-08-30 22:46:50" + offset -> doğru instant.
 *
 * new Date("2026-08-30 22:46:50") sunucunun yerel saat dilimini varsayar;
 * Vercel'de bu UTC olduğu için TR export'u 3 saat kayar ve pozisyonlar yanlış
 * çeyreğe düşer. Offset'i açıkça yazarak bunu kapatıyoruz.
 */
function parseBinanceTime(raw: string, utcOffset: number): Date | null {
  const m = (raw ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const sign = utcOffset < 0 ? "-" : "+";
  const abs = Math.abs(utcOffset);
  const hh = String(Math.floor(abs)).padStart(2, "0");
  const mm = String(Math.round((abs % 1) * 60)).padStart(2, "0");
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${sign}${hh}:${mm}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "0.00738570USDT" -> { amount: 0.0073857, asset: "USDT" } */
export function parseFeeCell(raw: string): { amount: number; asset: string } {
  const m = (raw ?? "").trim().match(/^(-?[\d.]+)\s*([A-Za-z]*)$/);
  if (!m) return { amount: 0, asset: "" };
  const amount = parseFloat(m[1]);
  return { amount: Number.isNaN(amount) ? 0 : amount, asset: m[2].toUpperCase() };
}

function quarterFromIndex(i: QIndex): QuarterCycle {
  return QUARTERS[i];
}

export function parseBinanceFuturesCsv(
  csvText: string,
  userId: string,
  utcOffset: number
): ParseResult {
  const warnings: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(csvText.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const required = ["Time", "Symbol", "Side", "Price", "Quantity"];
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    warnings.push(
      `CSV kolonları tanınamadı (eksik: ${missing.join(", ")}). Binance → Orders & Trade History → Trade History → Export ile indirdiğiniz dosyayı seçin.`
    );
    return { rows: [], warnings };
  }

  if (!headers.includes("Realized Profit")) {
    warnings.push("'Realized Profit' kolonu yok — P&L hesaplanamaz, pozisyonlar sıfır kârla içe aktarılır.");
  }

  const fills: BinanceFill[] = [];
  const nonUsdtFeeAssets = new Set<string>();
  let badRows = 0;

  for (const row of parsed.data) {
    const symbol = (row["Symbol"] ?? "").trim();
    const sideRaw = (row["Side"] ?? "").trim().toUpperCase();
    const time = parseBinanceTime(row["Time"] ?? "", utcOffset);
    const price = parseFloat(row["Price"] ?? "");
    const qty = Math.abs(parseFloat(row["Quantity"] ?? ""));

    if (!symbol || !sideRaw || !time || !qty || Number.isNaN(price)) {
      badRows++;
      continue;
    }

    const { amount: fee, asset: feeAsset } = parseFeeCell(row["Fee"] ?? "");
    if (feeAsset && feeAsset !== "USDT") nonUsdtFeeAssets.add(feeAsset);

    fills.push({
      uid: (row["Uid"] ?? "").trim(),
      symbol,
      side: sideRaw.startsWith("B") ? "Buy" : "Sell",
      qty,
      price,
      time,
      fee,
      feeAsset,
      realizedProfit: parseFloat(row["Realized Profit"] ?? "0") || 0,
      tradeId: (row["Trade ID"] ?? "").trim(),
    });
  }

  if (badRows > 0) warnings.push(`${badRows} satır okunamadı ve atlandı.`);
  if (nonUsdtFeeAssets.size > 0) {
    warnings.push(
      `Bazı fee'ler USDT dışında ödenmiş (${[...nonUsdtFeeAssets].join(", ")}). ` +
      `Kur bilgisi olmadığı için bu tutarlar net P&L'den düşülmedi; ilgili ` +
      `satırlar "eksik maliyet verisi" olarak işaretlendi.`
    );
  }
  if (fills.length === 0) {
    warnings.push("Dosyada geçerli fill satırı bulunamadı.");
    return { rows: [], warnings };
  }

  // Net pozisyon yalnızca aynı hesap + aynı sembol içinde anlamlı.
  const groups = new Map<string, BinanceFill[]>();
  for (const f of fills) {
    const gKey = `${f.uid}|${f.symbol}`;
    if (!groups.has(gKey)) groups.set(gKey, []);
    groups.get(gKey)!.push(f);
  }

  const rows: ParsedTradeRow[] = [];
  const stillOpen: string[] = [];
  const preExisting: string[] = [];

  for (const groupFills of groups.values()) {
    const { cycles, leftover } = walkFlatToFlat(groupFills);
    const symbol = groupFills[0].symbol;

    for (const cycle of cycles) {
      // CSV her zaman bir yerden başlar. Bir pozisyonun *ilk* fill'i kâr/zarar
      // realize etmişse, o fill aslında dosyadan önce açılmış bir pozisyonu
      // kapatıyordur — giriş fiyatı elimizde olmadığı için içe aktarmak
      // uydurma veri üretir.
      if (cycle[0].realizedProfit !== 0) {
        preExisting.push(symbol);
        continue;
      }
      rows.push(buildRow(cycle));
    }

    if (leftover.length > 0) {
      // Artık fill'in ilki kâr realize etmişse bu "açık pozisyon" değil,
      // dosya öncesinden gelen bir pozisyonun kapanış artığıdır.
      if (leftover[0].realizedProfit !== 0) preExisting.push(symbol);
      else stillOpen.push(symbol);
    }
  }

  if (stillOpen.length > 0) {
    warnings.push(
      `Dosya sonunda hâlâ açık pozisyon var (${[...new Set(stillOpen)].join(", ")}) — kapandıktan sonra tekrar export edip yükleyin.`
    );
  }
  if (preExisting.length > 0) {
    warnings.push(
      `${preExisting.length} pozisyon (${[...new Set(preExisting)].join(", ")}) dosya başlamadan önce açılmış görünüyor — giriş fiyatı bilinmediği için atlandı.`
    );
  }

  rows.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
  return { rows, warnings };
}

function buildRow(cycle: BinanceFill[]): ParsedTradeRow {
  const { direction, quantity, entryPrice, exitPrice, entryTime, exitTime, durationSec } =
    summarizeCycle(cycle);

  // Binance kâr/zararı kendisi realize eder; kontrat çarpanı tahminine gerek yok.
  const grossPnl = cycle.reduce((s, f) => s + f.realizedProfit, 0);

  // Komisyonlar para birimine gore ayriliyor. Yalnizca quote currency ile
  // ayni olanlar netPnl'den dusulebilir; BNB gibi baska bir varlikta odenmis
  // bir fee'yi USDT karindan cikarmak birim olarak gecersizdir. Kur donusumu
  // olmadigi icin bu satirlar "eksik maliyet verisi" olarak isaretleniyor.
  const feesByAsset: Record<string, number> = {};
  for (const f of cycle) {
    if (!f.fee) continue;
    const asset = f.feeAsset || QUOTE_CURRENCY;
    feesByAsset[asset] = (feesByAsset[asset] ?? 0) + f.fee;
  }
  const fees = feesByAsset[QUOTE_CURRENCY] ?? 0;
  const uncountedFees = Object.fromEntries(
    Object.entries(feesByAsset).filter(([asset]) => asset !== QUOTE_CURRENCY)
  );
  const hasUncounted = Object.keys(uncountedFees).length > 0;

  // Pozisyonun açıldığı andaki QT konumu. resolveQuarter hafta sonu ayrımı
  // yapmaz — kripto 7/24 işlem gördüğü için burada istediğimiz de bu.
  const q = resolveQuarter(entryTime);

  // Trade ID'ler broker tarafında kalıcı; hash yerine onları kullanmak, üst üste
  // binen iki export'ta aynı pozisyonun aynı anahtarı almasını garanti eder.
  const ids = cycle.map((f) => f.tradeId).filter(Boolean);
  const externalRef =
    ids.length > 0
      ? `binance:${cycle[0].uid}:${ids[0]}:${ids[ids.length - 1]}`
      : `binance:${cycle[0].uid}:${cycle[0].symbol}:${entryTime.toISOString()}`;

  return {
    key: externalRef,
    source: "BINANCE_FUTURES",
    account: cycle[0].uid || null,
    instrument: cycle[0].symbol,
    direction,
    quantity,
    entryPrice,
    exitPrice,
    entryTime: entryTime.toISOString(),
    exitTime: exitTime.toISOString(),
    durationSec,
    grossPnl,
    commission: null, // Binance tek bir fee kolonu verir
    fees: fees || null,
    netPnl: grossPnl - fees,
    ...(hasUncounted ? { uncountedFees } : {}),
    // Binance bu export'ta funding vermiyor; perp pozisyonlarinda net sonuc
    // her halukarda eksik maliyet iceriyor.
    costDataIncomplete: true,
    externalRef,
    needsManualPnl: false,
    fundingFee: null, // Binance funding'i bu export'ta vermiyor
    baseAsset: toBaseAsset(cycle[0].symbol),
    session: SESSION_BY_NAME[q.session.name] ?? null,
    quarter90: quarterFromIndex(q.activeQIndex),
    quarterMicro: quarterFromIndex(q.microIndex),
  };
}
