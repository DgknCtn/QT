/**
 * Economic events: June 23 – July 29, 2026
 * Source: Investing.com calendar (screenshot calendar2.png)
 * Times displayed in GMT-4 (EDT) → stored as UTC
 * Run: npx dotenv-cli -e .env -- npx tsx prisma/seed-events-june-july-2026.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const USER_ID = "fdbe609d-f687-4b34-bebf-7ea6e78812d6";

function utc(dateStr: string, utcHour: number, utcMin: number): Date {
  const d = new Date(`${dateStr}T${String(utcHour).padStart(2,"0")}:${String(utcMin).padStart(2,"0")}:00Z`);
  return d;
}

const events = [
  // ── Tuesday, June 23, 2026 ────────────────────────────────────────────────
  {
    id: "ev-2026-06-23-001",
    dateTime: utc("2026-06-23", 13, 45), // 09:45 EDT → 13:45 UTC
    currency: "USD",
    eventName: "S&P Global Services PMI (Jun) P",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Preliminary reading.",
  },
  {
    id: "ev-2026-06-23-002",
    dateTime: utc("2026-06-23", 13, 45), // 09:45 EDT → 13:45 UTC
    currency: "USD",
    eventName: "S&P Global Manufacturing PMI (Jun) P",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Preliminary reading.",
  },

  // ── Wednesday, June 24, 2026 ──────────────────────────────────────────────
  {
    id: "ev-2026-06-24-001",
    dateTime: utc("2026-06-24", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "New Home Sales (May)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },
  {
    id: "ev-2026-06-24-002",
    dateTime: utc("2026-06-24", 14, 30), // 10:30 EDT → 14:30 UTC
    currency: "USD",
    eventName: "Crude Oil Inventories",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },

  // ── Thursday, June 25, 2026 ───────────────────────────────────────────────
  {
    id: "ev-2026-06-25-001",
    dateTime: utc("2026-06-25", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "Core PCE Price Index (YoY) (May)",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 15,
    noTradeAfterMinutes: 30,
    notes: "Fed's preferred inflation gauge. High volatility.",
  },
  {
    id: "ev-2026-06-25-002",
    dateTime: utc("2026-06-25", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "Core PCE Price Index (MoM) (May)",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 15,
    noTradeAfterMinutes: 30,
    notes: "Fed's preferred inflation gauge.",
  },
  {
    id: "ev-2026-06-25-003",
    dateTime: utc("2026-06-25", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "GDP (QoQ) (Q1)",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 15,
    noTradeAfterMinutes: 30,
    notes: "Final Q1 GDP reading.",
  },
  {
    id: "ev-2026-06-25-004",
    dateTime: utc("2026-06-25", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "Durable Goods Orders (MoM) (May) P",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Preliminary reading.",
  },
  {
    id: "ev-2026-06-25-005",
    dateTime: utc("2026-06-25", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "Initial Jobless Claims",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Weekly claims. Cluster with PCE/GDP — high vol day.",
  },

  // ── Monday, June 29, 2026 ─────────────────────────────────────────────────
  {
    id: "ev-2026-06-29-001",
    dateTime: utc("2026-06-30", 1, 30), // 21:30 EDT June 29 → 01:30 UTC June 30
    currency: "CNY",
    eventName: "Manufacturing PMI (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "China official PMI. Released after US market hours.",
  },

  // ── Tuesday, June 30, 2026 ────────────────────────────────────────────────
  {
    id: "ev-2026-06-30-001",
    dateTime: utc("2026-06-30", 6, 0), // 02:00 EDT → 06:00 UTC
    currency: "GBP",
    eventName: "GDP (QoQ) (Q1)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },
  {
    id: "ev-2026-06-30-002",
    dateTime: utc("2026-06-30", 6, 0), // 02:00 EDT → 06:00 UTC
    currency: "GBP",
    eventName: "GDP (YoY) (Q1)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },
  {
    id: "ev-2026-06-30-003",
    dateTime: utc("2026-06-30", 12, 0), // 08:00 EDT → 12:00 UTC
    currency: "EUR",
    eventName: "German CPI (MoM) (Jun) P",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "German CPI preliminary.",
  },
  {
    id: "ev-2026-06-30-004",
    dateTime: utc("2026-06-30", 13, 45), // 09:45 EDT → 13:45 UTC
    currency: "USD",
    eventName: "Chicago PMI (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },
  {
    id: "ev-2026-06-30-005",
    dateTime: utc("2026-06-30", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "JOLTS Job Openings (May)",
    impact: "HIGH" as const,
    userRiskTag: "WATCH" as const,
    notes: "Labor market indicator. Can move NQ 20-40pts.",
  },
  {
    id: "ev-2026-06-30-006",
    dateTime: utc("2026-06-30", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "CB Consumer Confidence (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },

  // ── Wednesday, July 1, 2026 ───────────────────────────────────────────────
  {
    id: "ev-2026-07-01-001",
    dateTime: utc("2026-07-01", 9, 0), // 05:00 EDT → 09:00 UTC
    currency: "EUR",
    eventName: "CPI (YoY) (Jun) P",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Eurozone CPI preliminary.",
  },
  {
    id: "ev-2026-07-01-002",
    dateTime: utc("2026-07-01", 12, 15), // 08:15 EDT → 12:15 UTC
    currency: "USD",
    eventName: "ADP Nonfarm Employment Change (Jun)",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 15,
    noTradeAfterMinutes: 30,
    notes: "ADP precursor to NFP. High volatility.",
  },
  {
    id: "ev-2026-07-01-003",
    dateTime: utc("2026-07-01", 13, 45), // 09:45 EDT → 13:45 UTC
    currency: "USD",
    eventName: "S&P Global Manufacturing PMI (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Final reading.",
  },
  {
    id: "ev-2026-07-01-004",
    dateTime: utc("2026-07-01", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "ISM Manufacturing PMI (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },
  {
    id: "ev-2026-07-01-005",
    dateTime: utc("2026-07-01", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "ISM Manufacturing Prices (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },

  // ── Thursday, July 2, 2026 — NFP ─────────────────────────────────────────
  {
    id: "ev-2026-07-02-001",
    dateTime: utc("2026-07-02", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "Nonfarm Payrolls (Jun)",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 30,
    noTradeAfterMinutes: 60,
    notes: "NFP. Extreme volatility expected. Full no-trade window.",
  },
  {
    id: "ev-2026-07-02-002",
    dateTime: utc("2026-07-02", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "Unemployment Rate (Jun)",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 30,
    noTradeAfterMinutes: 60,
    notes: "Released with NFP. Cluster event.",
  },
  {
    id: "ev-2026-07-02-003",
    dateTime: utc("2026-07-02", 12, 30), // 08:30 EDT → 12:30 UTC
    currency: "USD",
    eventName: "Average Hourly Earnings (MoM) (Jun)",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 30,
    noTradeAfterMinutes: 60,
    notes: "Wage inflation component of NFP cluster.",
  },

  // ── Monday, July 6, 2026 ──────────────────────────────────────────────────
  {
    id: "ev-2026-07-06-001",
    dateTime: utc("2026-07-06", 13, 45), // 09:45 EDT → 13:45 UTC
    currency: "USD",
    eventName: "S&P Global Services PMI (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Final reading.",
  },
  {
    id: "ev-2026-07-06-002",
    dateTime: utc("2026-07-06", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "ISM Non-Manufacturing Prices (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },
  {
    id: "ev-2026-07-06-003",
    dateTime: utc("2026-07-06", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "ISM Non-Manufacturing PMI (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },

  // ── Thursday, July 9, 2026 ────────────────────────────────────────────────
  {
    id: "ev-2026-07-09-001",
    dateTime: utc("2026-07-09", 14, 0), // 10:00 EDT → 14:00 UTC
    currency: "USD",
    eventName: "Existing Home Sales (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
  },

  // ── Friday, July 10, 2026 ─────────────────────────────────────────────────
  {
    id: "ev-2026-07-10-001",
    dateTime: utc("2026-07-10", 6, 0), // 02:00 EDT → 06:00 UTC
    currency: "EUR",
    eventName: "German CPI (MoM) (Jun)",
    impact: "MEDIUM" as const,
    userRiskTag: "WATCH" as const,
    notes: "Final reading.",
  },

  // ── Wednesday, July 15, 2026 ─────────────────────────────────────────────
  {
    id: "ev-2026-07-15-001",
    dateTime: utc("2026-07-15", 13, 45), // 09:45 EDT → 13:45 UTC
    currency: "CAD",
    eventName: "BoC Interest Rate Decision",
    impact: "HIGH" as const,
    userRiskTag: "HIGH_RISK" as const,
    noTradeBeforeMinutes: 15,
    noTradeAfterMinutes: 30,
    notes: "Bank of Canada rate decision. CAD pairs volatile.",
  },

  // ── Wednesday, July 29, 2026 — FOMC ──────────────────────────────────────
  {
    id: "ev-2026-07-29-001",
    dateTime: utc("2026-07-29", 18, 0), // 14:00 EDT → 18:00 UTC
    currency: "USD",
    eventName: "Fed Interest Rate Decision",
    impact: "HIGH" as const,
    userRiskTag: "NO_TRADE_WINDOW" as const,
    noTradeBeforeMinutes: 30,
    noTradeAfterMinutes: 60,
    notes: "FOMC rate decision. Most market-moving event. Full no-trade window.",
  },
];

async function main() {
  console.log(`🌱 Seeding ${events.length} economic events…\n`);

  let created = 0;
  const skipped = 0;

  for (const ev of events) {
    await prisma.economicEvent.upsert({
      where: { id: ev.id },
      update: { dateTime: ev.dateTime },
      create: { ...ev, userId: USER_ID, source: "MANUAL" },
    });
    console.log(`  ✅ ${ev.eventName} → ${ev.dateTime.toISOString()}`);
    created++;
  }

  console.log(`\n✨ Done! Created: ${created}, Already existed: ${skipped}`);
}

main()
  .catch((e) => { console.error("\n❌ Failed:", e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
