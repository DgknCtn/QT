/**
 * Economic events: August 1 – December 31, 2026
 * Source: Investing.com Economic Calendar screenshot (calendar güncel.png)
 *   - Importance filter: HIGH  → every timed event below is `impact: "HIGH"`
 *   - Displayed timezone: GMT+3 (Istanbul), per "Current Time: 04:44 (GMT+3:00)"
 *
 * `tr()` converts the GMT+3 wall-clock time from the screenshot to UTC. The
 * source time is kept in a trailing comment on every row so the conversion can
 * be re-checked later.
 *
 * Sanity check on the conversion: the Sep/Oct Fed decisions read 21:00 GMT+3
 * while the Dec one reads 22:00 — that is the US DST rollover, and all three
 * land on 14:00 New York.
 *
 * Global satır olarak yazılır (userId = null), yani TÜM hesaplarda görünür.
 *
 * Run: npx tsx prisma/seed-events-aug-dec-2026.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { upsertGlobalEvents } from "./upsert-global-events";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

/** GMT+3 wall clock (as shown in the screenshot) → UTC instant. */
function tr(dateStr: string, hh: number, mm: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - 3, mm, 0));
}

type Ev = {
  key: string;
  dateTime: Date;
  currency: string;
  eventName: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  userRiskTag: "IGNORE" | "WATCH" | "HIGH_RISK" | "NO_TRADE_WINDOW" | "DATA_HIGH_LOW_RELEVANT" | null;
  noTradeBeforeMinutes?: number;
  noTradeAfterMinutes?: number;
  notes?: string;
};

/** Top-tier USD releases: hard no-trade window. */
const NTW = { userRiskTag: "NO_TRADE_WINDOW" as const, noTradeBeforeMinutes: 15, noTradeAfterMinutes: 30 };
/** Non-USD high impact: elevated risk, same window. */
const HR = { userRiskTag: "HIGH_RISK" as const, noTradeBeforeMinutes: 15, noTradeAfterMinutes: 30 };
/** Secondary releases: worth watching, no blackout. */
const W = { userRiskTag: "WATCH" as const };

const events: Ev[] = [
  // ── Monday, August 3 ──────────────────────────────────────────────────────
  { key: "ev-2026-08-03-001", dateTime: tr("2026-08-03", 16, 45), currency: "USD", eventName: "S&P Global Manufacturing PMI (Jul)", impact: "HIGH", ...W }, // 16:45 GMT+3
  { key: "ev-2026-08-03-002", dateTime: tr("2026-08-03", 17, 0), currency: "USD", eventName: "ISM Manufacturing PMI (Jul)", impact: "HIGH", ...NTW }, // 17:00 GMT+3
  { key: "ev-2026-08-03-003", dateTime: tr("2026-08-03", 17, 0), currency: "USD", eventName: "ISM Manufacturing Prices (Jul)", impact: "HIGH", ...W }, // 17:00 GMT+3

  // ── Tuesday, August 4 ─────────────────────────────────────────────────────
  { key: "ev-2026-08-04-001", dateTime: tr("2026-08-04", 17, 0), currency: "USD", eventName: "JOLTS Job Openings (Jun)", impact: "HIGH", ...W }, // 17:00 GMT+3

  // ── Wednesday, August 5 ───────────────────────────────────────────────────
  { key: "ev-2026-08-05-001", dateTime: tr("2026-08-05", 15, 15), currency: "USD", eventName: "ADP Nonfarm Employment Change (Jul)", impact: "HIGH", ...NTW, notes: "NFP öncesi istihdam sinyali." }, // 15:15 GMT+3
  { key: "ev-2026-08-05-002", dateTime: tr("2026-08-05", 16, 45), currency: "USD", eventName: "S&P Global Services PMI (Jul)", impact: "HIGH", ...W }, // 16:45 GMT+3
  { key: "ev-2026-08-05-003", dateTime: tr("2026-08-05", 17, 0), currency: "USD", eventName: "ISM Non-Manufacturing PMI (Jul)", impact: "HIGH", ...NTW }, // 17:00 GMT+3
  { key: "ev-2026-08-05-004", dateTime: tr("2026-08-05", 17, 0), currency: "USD", eventName: "ISM Non-Manufacturing Prices (Jul)", impact: "HIGH", ...W }, // 17:00 GMT+3
  { key: "ev-2026-08-05-005", dateTime: tr("2026-08-05", 17, 30), currency: "USD", eventName: "Crude Oil Inventories", impact: "HIGH", ...W }, // 17:30 GMT+3
  { key: "ev-2026-08-05-006", dateTime: tr("2026-08-05", 23, 30), currency: "USD", eventName: "U.S. President Trump Speaks", impact: "HIGH", ...W, notes: "Konuşma — başlık riski." }, // 23:30 GMT+3

  // ── Thursday, August 6 ────────────────────────────────────────────────────
  { key: "ev-2026-08-06-001", dateTime: tr("2026-08-06", 15, 30), currency: "USD", eventName: "Initial Jobless Claims", impact: "HIGH", ...NTW }, // 15:30 GMT+3

  // ── Friday, August 7 — NFP ────────────────────────────────────────────────
  { key: "ev-2026-08-07-001", dateTime: tr("2026-08-07", 15, 30), currency: "USD", eventName: "Nonfarm Payrolls (Jul)", impact: "HIGH", userRiskTag: "NO_TRADE_WINDOW", noTradeBeforeMinutes: 30, noTradeAfterMinutes: 60, notes: "NFP — ayın en volatil açıklaması." }, // 15:30 GMT+3
  { key: "ev-2026-08-07-002", dateTime: tr("2026-08-07", 15, 30), currency: "USD", eventName: "Unemployment Rate (Jul)", impact: "HIGH", ...NTW, notes: "NFP ile eşzamanlı." }, // 15:30 GMT+3
  { key: "ev-2026-08-07-003", dateTime: tr("2026-08-07", 15, 30), currency: "USD", eventName: "Average Hourly Earnings (MoM) (Jul)", impact: "HIGH", ...NTW, notes: "NFP ile eşzamanlı." }, // 15:30 GMT+3

  // ── Tuesday, August 11 ────────────────────────────────────────────────────
  { key: "ev-2026-08-11-001", dateTime: tr("2026-08-11", 7, 30), currency: "AUD", eventName: "RBA Interest Rate Decision (Aug)", impact: "HIGH", ...HR }, // 07:30 GMT+3
  { key: "ev-2026-08-11-002", dateTime: tr("2026-08-11", 17, 0), currency: "USD", eventName: "Existing Home Sales (Jul)", impact: "HIGH", ...W }, // 17:00 GMT+3

  // ── Wednesday, August 12 — CPI ────────────────────────────────────────────
  { key: "ev-2026-08-12-001", dateTime: tr("2026-08-12", 9, 0), currency: "EUR", eventName: "German CPI (MoM) (Jul)", impact: "HIGH", ...HR }, // 09:00 GMT+3
  { key: "ev-2026-08-12-002", dateTime: tr("2026-08-12", 15, 30), currency: "USD", eventName: "CPI (YoY) (Jul)", impact: "HIGH", userRiskTag: "NO_TRADE_WINDOW", noTradeBeforeMinutes: 30, noTradeAfterMinutes: 60, notes: "CPI — NFP ile birlikte en sert hareket eden veri." }, // 15:30 GMT+3
  { key: "ev-2026-08-12-003", dateTime: tr("2026-08-12", 15, 30), currency: "USD", eventName: "CPI (MoM) (Jul)", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-12-004", dateTime: tr("2026-08-12", 15, 30), currency: "USD", eventName: "Core CPI (MoM) (Jul)", impact: "HIGH", ...NTW, notes: "Fed'in yakından izlediği çekirdek enflasyon." }, // 15:30 GMT+3
  { key: "ev-2026-08-12-005", dateTime: tr("2026-08-12", 17, 30), currency: "USD", eventName: "Crude Oil Inventories", impact: "HIGH", ...W }, // 17:30 GMT+3
  { key: "ev-2026-08-12-006", dateTime: tr("2026-08-12", 20, 0), currency: "USD", eventName: "10-Year Note Auction", impact: "HIGH", ...W, notes: "Tahvil ihalesi — getiri tarafında hareket." }, // 20:00 GMT+3

  // ── Thursday, August 13 ───────────────────────────────────────────────────
  { key: "ev-2026-08-13-001", dateTime: tr("2026-08-13", 9, 0), currency: "GBP", eventName: "GDP (YoY) (Q2) P", impact: "HIGH", ...HR }, // 09:00 GMT+3
  { key: "ev-2026-08-13-002", dateTime: tr("2026-08-13", 9, 0), currency: "GBP", eventName: "GDP (QoQ) (Q2) P", impact: "HIGH", ...HR }, // 09:00 GMT+3
  { key: "ev-2026-08-13-003", dateTime: tr("2026-08-13", 9, 0), currency: "GBP", eventName: "GDP (MoM) (Jun)", impact: "HIGH", ...HR }, // 09:00 GMT+3
  { key: "ev-2026-08-13-004", dateTime: tr("2026-08-13", 15, 30), currency: "USD", eventName: "PPI (MoM) (Jul)", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-13-005", dateTime: tr("2026-08-13", 15, 30), currency: "USD", eventName: "Initial Jobless Claims", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-13-006", dateTime: tr("2026-08-13", 20, 0), currency: "USD", eventName: "30-Year Bond Auction", impact: "HIGH", ...W }, // 20:00 GMT+3

  // ── Friday, August 14 ─────────────────────────────────────────────────────
  { key: "ev-2026-08-14-001", dateTime: tr("2026-08-14", 15, 30), currency: "USD", eventName: "Retail Sales (MoM) (Jul)", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-14-002", dateTime: tr("2026-08-14", 15, 30), currency: "USD", eventName: "Core Retail Sales (MoM) (Jul)", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-14-003", dateTime: tr("2026-08-14", 22, 0), currency: "USD", eventName: "U.S. President Trump Speaks", impact: "HIGH", ...W, notes: "Konuşma — başlık riski." }, // 22:00 GMT+3

  // ── Monday, August 17 ─────────────────────────────────────────────────────
  { key: "ev-2026-08-17-001", dateTime: tr("2026-08-17", 2, 50), currency: "JPY", eventName: "GDP (QoQ) (Q2) P", impact: "HIGH", ...HR, notes: "Asya seansı." }, // 02:50 GMT+3

  // ── Wednesday, August 19 ──────────────────────────────────────────────────
  { key: "ev-2026-08-19-001", dateTime: tr("2026-08-19", 9, 0), currency: "GBP", eventName: "CPI (YoY) (Jul)", impact: "HIGH", ...HR }, // 09:00 GMT+3
  { key: "ev-2026-08-19-002", dateTime: tr("2026-08-19", 12, 0), currency: "EUR", eventName: "CPI (YoY) (Jul)", impact: "HIGH", ...HR }, // 12:00 GMT+3
  { key: "ev-2026-08-19-003", dateTime: tr("2026-08-19", 17, 30), currency: "USD", eventName: "Crude Oil Inventories", impact: "HIGH", ...W }, // 17:30 GMT+3
  { key: "ev-2026-08-19-004", dateTime: tr("2026-08-19", 21, 0), currency: "USD", eventName: "FOMC Meeting Minutes", impact: "HIGH", userRiskTag: "NO_TRADE_WINDOW", noTradeBeforeMinutes: 15, noTradeAfterMinutes: 45, notes: "Tutanaklar — 14:00 New York. Sert ters dönüşler görülebilir." }, // 21:00 GMT+3

  // ── Thursday, August 20 ───────────────────────────────────────────────────
  { key: "ev-2026-08-20-001", dateTime: tr("2026-08-20", 15, 30), currency: "USD", eventName: "Initial Jobless Claims", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-20-002", dateTime: tr("2026-08-20", 15, 30), currency: "USD", eventName: "Philadelphia Fed Manufacturing Index (Aug)", impact: "HIGH", ...W }, // 15:30 GMT+3

  // ── Friday, August 21 ─────────────────────────────────────────────────────
  { key: "ev-2026-08-21-001", dateTime: tr("2026-08-21", 16, 45), currency: "USD", eventName: "S&P Global Manufacturing PMI (Aug) P", impact: "HIGH", ...W }, // 16:45 GMT+3
  { key: "ev-2026-08-21-002", dateTime: tr("2026-08-21", 16, 45), currency: "USD", eventName: "S&P Global Services PMI (Aug) P", impact: "HIGH", ...W }, // 16:45 GMT+3

  // ── Tuesday, August 25 ────────────────────────────────────────────────────
  { key: "ev-2026-08-25-001", dateTime: tr("2026-08-25", 9, 0), currency: "EUR", eventName: "German GDP (QoQ) (Q2)", impact: "HIGH", ...HR }, // 09:00 GMT+3
  { key: "ev-2026-08-25-002", dateTime: tr("2026-08-25", 17, 0), currency: "USD", eventName: "CB Consumer Confidence (Aug)", impact: "HIGH", ...W }, // 17:00 GMT+3
  { key: "ev-2026-08-25-003", dateTime: tr("2026-08-25", 17, 0), currency: "USD", eventName: "New Home Sales (Jul)", impact: "HIGH", ...W }, // 17:00 GMT+3

  // ── Wednesday, August 26 — PCE + GDP ──────────────────────────────────────
  { key: "ev-2026-08-26-001", dateTime: tr("2026-08-26", 15, 30), currency: "USD", eventName: "Core PCE Price Index (YoY) (Jul)", impact: "HIGH", ...NTW, notes: "Fed'in tercih ettiği enflasyon göstergesi." }, // 15:30 GMT+3
  { key: "ev-2026-08-26-002", dateTime: tr("2026-08-26", 15, 30), currency: "USD", eventName: "Core PCE Price Index (MoM) (Jul)", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-26-003", dateTime: tr("2026-08-26", 15, 30), currency: "USD", eventName: "GDP (QoQ) (Q2) P", impact: "HIGH", ...NTW }, // 15:30 GMT+3
  { key: "ev-2026-08-26-004", dateTime: tr("2026-08-26", 15, 30), currency: "USD", eventName: "Durable Goods Orders (MoM) (Jul) P", impact: "HIGH", ...W }, // 15:30 GMT+3

  // ── Monday, August 31 ─────────────────────────────────────────────────────
  { key: "ev-2026-08-31-001", dateTime: tr("2026-08-31", 4, 30), currency: "CNY", eventName: "Manufacturing PMI (Aug)", impact: "HIGH", ...HR, notes: "Asya seansı." }, // 04:30 GMT+3
  { key: "ev-2026-08-31-002", dateTime: tr("2026-08-31", 15, 0), currency: "EUR", eventName: "German CPI (MoM) (Aug) P", impact: "HIGH", ...HR }, // 15:00 GMT+3
  { key: "ev-2026-08-31-003", dateTime: tr("2026-08-31", 16, 45), currency: "USD", eventName: "Chicago PMI (Aug)", impact: "HIGH", ...W }, // 16:45 GMT+3

  // ── Tuesday, September 1 ──────────────────────────────────────────────────
  { key: "ev-2026-09-01-001", dateTime: tr("2026-09-01", 12, 0), currency: "EUR", eventName: "CPI (YoY) (Aug) P", impact: "HIGH", ...HR }, // 12:00 GMT+3
  { key: "ev-2026-09-01-002", dateTime: tr("2026-09-01", 16, 45), currency: "USD", eventName: "S&P Global Manufacturing PMI (Aug)", impact: "HIGH", ...W }, // 16:45 GMT+3
  { key: "ev-2026-09-01-003", dateTime: tr("2026-09-01", 17, 0), currency: "USD", eventName: "ISM Manufacturing PMI (Aug)", impact: "HIGH", ...NTW }, // 17:00 GMT+3
  { key: "ev-2026-09-01-004", dateTime: tr("2026-09-01", 17, 0), currency: "USD", eventName: "ISM Manufacturing Prices (Aug)", impact: "HIGH", ...W }, // 17:00 GMT+3
  { key: "ev-2026-09-01-005", dateTime: tr("2026-09-01", 17, 0), currency: "USD", eventName: "JOLTS Job Openings (Jul)", impact: "HIGH", ...W }, // 17:00 GMT+3

  // ── Wednesday, September 2 ────────────────────────────────────────────────
  { key: "ev-2026-09-02-001", dateTime: tr("2026-09-02", 15, 15), currency: "USD", eventName: "ADP Nonfarm Employment Change (Aug)", impact: "HIGH", ...NTW, notes: "NFP öncesi istihdam sinyali." }, // 15:15 GMT+3

  // ── Thursday, September 3 ─────────────────────────────────────────────────
  { key: "ev-2026-09-03-001", dateTime: tr("2026-09-03", 16, 45), currency: "USD", eventName: "S&P Global Services PMI (Aug)", impact: "HIGH", ...W }, // 16:45 GMT+3
  { key: "ev-2026-09-03-002", dateTime: tr("2026-09-03", 17, 0), currency: "USD", eventName: "ISM Non-Manufacturing PMI (Aug)", impact: "HIGH", ...NTW }, // 17:00 GMT+3
  { key: "ev-2026-09-03-003", dateTime: tr("2026-09-03", 17, 0), currency: "USD", eventName: "ISM Non-Manufacturing Prices (Aug)", impact: "HIGH", ...W }, // 17:00 GMT+3

  // ── Friday, September 4 — NFP ─────────────────────────────────────────────
  { key: "ev-2026-09-04-001", dateTime: tr("2026-09-04", 15, 30), currency: "USD", eventName: "Nonfarm Payrolls (Aug)", impact: "HIGH", userRiskTag: "NO_TRADE_WINDOW", noTradeBeforeMinutes: 30, noTradeAfterMinutes: 60, notes: "NFP — ayın en volatil açıklaması." }, // 15:30 GMT+3
  { key: "ev-2026-09-04-002", dateTime: tr("2026-09-04", 15, 30), currency: "USD", eventName: "Unemployment Rate (Aug)", impact: "HIGH", ...NTW, notes: "NFP ile eşzamanlı." }, // 15:30 GMT+3
  { key: "ev-2026-09-04-003", dateTime: tr("2026-09-04", 15, 30), currency: "USD", eventName: "Average Hourly Earnings (MoM) (Aug)", impact: "HIGH", ...NTW, notes: "NFP ile eşzamanlı." }, // 15:30 GMT+3

  // ── Fed faiz kararları ────────────────────────────────────────────────────
  { key: "ev-2026-09-16-001", dateTime: tr("2026-09-16", 21, 0), currency: "USD", eventName: "Fed Interest Rate Decision", impact: "HIGH", userRiskTag: "NO_TRADE_WINDOW", noTradeBeforeMinutes: 30, noTradeAfterMinutes: 60, notes: "FOMC — 14:00 New York. Tam no-trade penceresi." }, // 21:00 GMT+3 (EDT dönemi)
  { key: "ev-2026-10-28-001", dateTime: tr("2026-10-28", 21, 0), currency: "USD", eventName: "Fed Interest Rate Decision", impact: "HIGH", userRiskTag: "NO_TRADE_WINDOW", noTradeBeforeMinutes: 30, noTradeAfterMinutes: 60, notes: "FOMC — 14:00 New York. Tam no-trade penceresi." }, // 21:00 GMT+3 (EDT dönemi)
  { key: "ev-2026-12-09-001", dateTime: tr("2026-12-09", 22, 0), currency: "USD", eventName: "Fed Interest Rate Decision", impact: "HIGH", userRiskTag: "NO_TRADE_WINDOW", noTradeBeforeMinutes: 30, noTradeAfterMinutes: 60, notes: "FOMC — 14:00 New York (EST). Tam no-trade penceresi." }, // 22:00 GMT+3 (EST dönemi)

  // ── ABD piyasa tatilleri / erken kapanışlar ───────────────────────────────
  // Volatilite olayı değiller, o yüzden impact LOW; ama işlem yapılamadığı için
  // no-trade olarak işaretli. Yabancı-only tatiller (RU/JP/IN/CN…) alınmadı.
  { key: "ev-2026-09-07-001", dateTime: tr("2026-09-07", 12, 0), currency: "USD", eventName: "ABD Piyasa Tatili — Labor Day", impact: "LOW", userRiskTag: "NO_TRADE_WINDOW", notes: "ABD piyasaları kapalı." },
  { key: "ev-2026-11-26-001", dateTime: tr("2026-11-26", 12, 0), currency: "USD", eventName: "ABD Piyasa Tatili — Thanksgiving", impact: "LOW", userRiskTag: "NO_TRADE_WINDOW", notes: "ABD piyasaları kapalı." },
  { key: "ev-2026-11-27-001", dateTime: tr("2026-11-27", 21, 0), currency: "USD", eventName: "ABD Erken Kapanış — Thanksgiving ertesi (13:00 ET)", impact: "LOW", userRiskTag: "WATCH", notes: "Yarım gün. Likidite çok düşük, NY PM seansı yok." },
  { key: "ev-2026-12-24-001", dateTime: tr("2026-12-24", 21, 0), currency: "USD", eventName: "ABD Erken Kapanış — Noel arifesi (13:00 ET)", impact: "LOW", userRiskTag: "WATCH", notes: "Yarım gün. Likidite çok düşük." },
  { key: "ev-2026-12-25-001", dateTime: tr("2026-12-25", 12, 0), currency: "USD", eventName: "ABD Piyasa Tatili — Noel", impact: "LOW", userRiskTag: "NO_TRADE_WINDOW", notes: "ABD piyasaları kapalı." },
];

async function main() {
  await upsertGlobalEvents(prisma, events);
}

main()
  .catch((e) => { console.error("\n❌ Hata:", e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
