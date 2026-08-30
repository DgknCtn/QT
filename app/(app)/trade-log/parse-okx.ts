import Papa from "papaparse";
import type { Session, QuarterCycle } from "@prisma/client";
import { walkFlatToFlat, summarizeCycle } from "@/lib/broker/cycle-engine";
import { resolveQuarter, type QIndex } from "@/lib/market-clock/quarters";
import { toBaseAsset } from "@/lib/broker/symbols";
import type { ParsedTradeRow, ParseResult } from "@/lib/broker/parsed-row";

/**
 * OKX "Trading History" CSV'sini pozisyonlara çevirir.
 *
 * Dosyanın şekli Binance'ten üç noktada ayrılıyor ve üçü de tuzak:
 *
 *  1. **BOM her satırın ve her alanın başında.** Sadece dosya başında değil:
 *     `UID:...,<BOM>Account Type:...` ve her veri satırı da BOM ile başlıyor.
 *     Global temizlenmezse başlık `﻿id` olur ve hiçbir alan bulunamaz.
 *  2. **Başlık 2. satırda.** 1. satır metadata:
 *     `UID:187...,Account Type:Main,Time Zone:UTC+3`
 *  3. **`Position Change` / `Position Balance` kolonları hep sıfır.** Pozisyon
 *     takibi için ideal görünüyorlar ama bu export'ta doldurulmuyorlar;
 *     flat-to-flat yürüyüşü şart.
 *
 * Buna karşılık iki büyük avantajı var: `Action` kolonu "Open/Close long/short"
 * diyerek yönü açıkça veriyor (Binance'te net miktardan tahmin ediyorduk), ve
 * saat dilimi dosyanın içinde yazılı.
 */

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const satisfies readonly QuarterCycle[];

const SESSION_BY_NAME: Record<string, Session> = {
  London: "LONDON",
  "NY AM": "NY_AM",
  "NY PM": "NY_PM",
  Asia: "ASIA",
};

/** OKX aksiyonları → cycle motorunun Buy/Sell sözleşmesi. */
const ACTION_SIDE = {
  "Open long": "Buy",
  "Close long": "Sell",
  "Open short": "Sell",
  "Close short": "Buy",
} as const satisfies Record<string, "Buy" | "Sell">;

type OkxAction = keyof typeof ACTION_SIDE;

function isTradeAction(a: string): a is OkxAction {
  return a in ACTION_SIDE;
}

type OkxFill = {
  id: string;
  symbol: string;
  action: OkxAction;
  side: "Buy" | "Sell";
  qty: number;
  price: number;
  time: Date;
  /** OKX negatif yazar; burada maliyet sözleşmesine çevrilir (pozitif = ödedin). */
  fee: number;
  pnl: number;
};

type FundingRow = { symbol: string; time: Date; pnl: number };

export type OkxPreamble = {
  uid: string | null;
  accountType: string | null;
  utcOffset: number | null;
};

/**
 * 1. satırdaki metadata: `UID:187...,Account Type:Main,Time Zone:UTC+3`
 *
 * Saat dilimi burada yazılı olduğu için kullanıcıya tahmin değil tespit
 * gösterebiliyoruz.
 */
export function parseOkxPreamble(line: string): OkxPreamble {
  const clean = line.replace(/﻿/g, "");
  const grab = (key: string) => {
    const m = clean.match(new RegExp(`${key}\\s*:\\s*([^,]+)`, "i"));
    return m ? m[1].trim() : null;
  };
  const tz = grab("Time Zone");
  const tzMatch = tz?.match(/UTC([+-]\d{1,2})/i);
  const offset = tzMatch ? parseInt(tzMatch[1], 10) : null;

  return {
    uid: grab("UID"),
    accountType: grab("Account Type"),
    utcOffset: offset != null && Math.abs(offset) <= 14 ? offset : null,
  };
}

/** "2026-08-23 10:04:49" + offset → doğru instant. */
function parseOkxTime(raw: string, utcOffset: number): Date | null {
  const m = (raw ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const sign = utcOffset < 0 ? "-" : "+";
  const hh = String(Math.abs(utcOffset)).padStart(2, "0");
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${sign}${hh}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function quarterFromIndex(i: QIndex): QuarterCycle {
  return QUARTERS[i];
}

export function parseOkxCsv(csvText: string, utcOffsetOverride?: number): ParseResult {
  const warnings: string[] = [];

  // BOM'lar global temizlenir: OKX bunları alan sınırlarına da serpiştiriyor.
  const lines = csvText.replace(/﻿/g, "").split(/\r?\n/);
  if (lines.length < 2) {
    warnings.push("Dosya boş görünüyor.");
    return { rows: [], warnings };
  }

  const preamble = parseOkxPreamble(lines[0]);
  const utcOffset = utcOffsetOverride ?? preamble.utcOffset ?? 0;
  if (utcOffsetOverride == null && preamble.utcOffset == null) {
    warnings.push("Dosyada saat dilimi bulunamadı, UTC+0 varsayıldı — yanlışsa yukarıdan değiştirin.");
  }

  const parsed = Papa.parse<Record<string, string>>(lines.slice(1).join("\n"), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const required = ["Time", "Symbol", "Action", "Amount", "Filled Price"];
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    warnings.push(
      `CSV kolonları tanınamadı (eksik: ${missing.join(", ")}). OKX → Assets → Order Center → Trading History → Export ile indirdiğiniz dosyayı seçin.`
    );
    return { rows: [], warnings };
  }

  const fills: OkxFill[] = [];
  const funding: FundingRow[] = [];
  let skippedTransfers = 0;
  let badRows = 0;

  for (const row of parsed.data) {
    const action = (row["Action"] ?? "").trim();
    const symbol = (row["Symbol"] ?? "").trim();
    const time = parseOkxTime(row["Time"] ?? "", utcOffset);

    // Funding, perp pozisyonunu elde tutmanın bedeli — işlem değil ama
    // pozisyonun gerçek sonucunun parçası. Ayrı toplanıp sahibine atanıyor.
    if (action.startsWith("Funding fee")) {
      if (time && symbol) funding.push({ symbol, time, pnl: parseFloat(row["PnL"] ?? "0") || 0 });
      continue;
    }

    // Para yatırma/çekme: hesap bakiyesini değiştirir, işlem sonucunu değil.
    if (action.startsWith("Transfer")) {
      skippedTransfers++;
      continue;
    }

    if (!isTradeAction(action)) {
      if (action) badRows++;
      continue;
    }

    const qty = Math.abs(parseFloat(row["Amount"] ?? ""));
    const price = parseFloat(row["Filled Price"] ?? "");
    if (!symbol || !time || !qty || Number.isNaN(price)) {
      badRows++;
      continue;
    }

    fills.push({
      id: (row["id"] ?? "").trim(),
      symbol,
      action,
      side: ACTION_SIDE[action],
      qty,
      price,
      time,
      // OKX fee'yi negatif yazar ("-0.01037400"). Binance ile aynı sözleşmeye
      // çeviriyoruz: pozitif = cebinden çıktı.
      fee: -(parseFloat(row["Fee"] ?? "0") || 0),
      pnl: parseFloat(row["PnL"] ?? "0") || 0,
    });
  }

  if (badRows > 0) warnings.push(`${badRows} satır okunamadı ve atlandı.`);
  if (skippedTransfers > 0) {
    warnings.push(`${skippedTransfers} para transferi satırı atlandı — işlem değiller.`);
  }
  if (fills.length === 0) {
    warnings.push("Dosyada geçerli işlem satırı bulunamadı.");
    return { rows: [], warnings };
  }

  const groups = new Map<string, OkxFill[]>();
  for (const f of fills) {
    if (!groups.has(f.symbol)) groups.set(f.symbol, []);
    groups.get(f.symbol)!.push(f);
  }

  const rows: ParsedTradeRow[] = [];
  const stillOpen: string[] = [];
  const preExisting: string[] = [];

  for (const groupFills of groups.values()) {
    const symbol = groupFills[0].symbol;
    const sorted = [...groupFills].sort((a, b) => a.time.getTime() - b.time.getTime());

    // CSV her zaman bir yerden başlar. Dosyanın ilk fill'leri "Close" ise
    // dosyadan önce açılmış bir pozisyonu kapatıyorlardır; giriş fiyatı
    // elimizde olmadığı için o pozisyon kurtarılamaz.
    //
    // Bunları yürüyüşten ÖNCE atmak şart: motor net miktara baktığı için
    // orphan bir "Close short"u sonraki "Open short" ile eşleştirir ve
    // arkadan gelen geçerli pozisyonu da bozar.
    //
    // Binance'te bu ayrımı "ilk fill kâr realize etmiş mi" sezgisiyle
    // yapıyorduk; OKX `Action` ile açıkça söylüyor.
    let start = 0;
    while (start < sorted.length && sorted[start].action.startsWith("Close")) start++;
    if (start > 0) preExisting.push(symbol);

    const { cycles, leftover } = walkFlatToFlat(sorted.slice(start));

    for (const cycle of cycles) {
      rows.push(buildRow(cycle, funding, preamble.uid));
    }

    if (leftover.length > 0) stillOpen.push(symbol);
  }

  if (stillOpen.length > 0) {
    warnings.push(
      `Dosya sonunda hâlâ açık pozisyon var (${[...new Set(stillOpen)].join(", ")}) — kapandıktan sonra tekrar export edip yükleyin.`
    );
  }
  if (preExisting.length > 0) {
    warnings.push(
      `${[...new Set(preExisting)].join(", ")} için dosya başlamadan önce açılmış pozisyonun kapanışı var — giriş fiyatı bilinmediği için o kapanış atlandı.`
    );
  }

  rows.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());

  return {
    rows,
    warnings,
    meta: {
      utcOffset: preamble.utcOffset ?? undefined,
      account: preamble.uid ?? undefined,
    },
  };
}

function buildRow(cycle: OkxFill[], funding: FundingRow[], uid: string | null): ParsedTradeRow {
  const { quantity, entryPrice, exitPrice, entryTime, exitTime, durationSec } =
    summarizeCycle(cycle);

  // Yön `Action`'dan okunuyor, net miktardan tahmin edilmiyor.
  const direction: "LONG" | "SHORT" = cycle[0].action === "Open long" ? "LONG" : "SHORT";

  const grossPnl = cycle.reduce((s, f) => s + f.pnl, 0);
  const fees = cycle.reduce((s, f) => s + f.fee, 0);

  // Pozisyon açıkken ödenen/alınan funding ona aittir. `PnL` pozitifse gelir,
  // maliyet sözleşmesine çevirmek için işareti çeviriyoruz.
  const symbol = cycle[0].symbol;
  const from = entryTime.getTime();
  const to = exitTime.getTime();
  const fundingIncome = funding
    .filter((f) => f.symbol === symbol && f.time.getTime() >= from && f.time.getTime() <= to)
    .reduce((s, f) => s + f.pnl, 0);
  // `|| 0` işaretli sıfırı düzeltir: -0 hem testlerde hem arayüzde "−$0.00" olur.
  const fundingFee = -fundingIncome || 0;

  const q = resolveQuarter(entryTime);

  const ids = cycle.map((f) => f.id).filter(Boolean);
  const externalRef =
    ids.length > 0
      ? `okx:${uid ?? ""}:${ids[0]}:${ids[ids.length - 1]}`
      : `okx:${uid ?? ""}:${symbol}:${entryTime.toISOString()}`;

  return {
    key: externalRef,
    source: "OKX",
    account: uid,
    instrument: symbol,
    direction,
    // Dikkat: OKX miktarı kontrat cinsinden verir (Trading Unit: cont),
    // yani quantity × price notional DEĞİLDİR.
    quantity,
    entryPrice,
    exitPrice,
    entryTime: entryTime.toISOString(),
    exitTime: exitTime.toISOString(),
    durationSec,
    grossPnl,
    commission: null,
    fees: fees || null,
    netPnl: grossPnl - fees - fundingFee,
    externalRef,
    needsManualPnl: false,
    fundingFee,
    baseAsset: toBaseAsset(symbol),
    session: SESSION_BY_NAME[q.session.name] ?? null,
    quarter90: quarterFromIndex(q.activeQIndex),
    quarterMicro: quarterFromIndex(q.microIndex),
  };
}
