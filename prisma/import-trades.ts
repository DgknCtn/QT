/**
 * Imports historical trades from broker export.
 * Run: npx dotenv-cli -e .env -- npx tsx prisma/import-trades.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const USER_ID = "fdbe609d-f687-4b34-bebf-7ea6e78812d6";

// Helper: determine market group from symbol
function mktGroup(symbol: string) {
  if (["BTCUSD", "ETHUSD", "XRPUSD", "SOLUSD"].includes(symbol)) return "CRYPTO" as const;
  return "FOREX" as const;
}

// Helper: determine triad from symbol
function triad(symbol: string) {
  if (["BTCUSD", "ETHUSD", "XRPUSD", "SOLUSD"].includes(symbol)) return "BTC_ETH_TOTAL3" as const;
  return "EU_GU_DXY" as const; // XAUUSD, XAGUSD, EURUSD all map here as best fit
}

// Helper: calculate R-multiple
function calcR(direction: "LONG" | "SHORT", entry: number, stop: number, exit: number): number | null {
  if (!stop || stop === 0) return null;
  if (direction === "LONG") {
    const risk = entry - stop;
    if (risk <= 0) return null;
    return parseFloat(((exit - entry) / risk).toFixed(2));
  } else {
    const risk = stop - entry;
    if (risk <= 0) return null;
    return parseFloat(((entry - exit) / risk).toFixed(2));
  }
}

const trades = [
  // ── Image 1 ──────────────────────────────────────────────────────────────
  {
    id:          "imp-1643717",
    instrument:  "XAUUSD",
    direction:   "LONG"  as const,
    date:        new Date("2026-05-18T13:09:44"),
    entryPrice:  4562.9,
    stopPrice:   4523.3,
    tpPrice:     4642.1,
    exitPrice:   4523.8,
    pnlDollars:  -20,
    result:      "LOSS" as const,
  },
  {
    id:          "imp-1446468",
    instrument:  "XAGUSD",
    direction:   "LONG"  as const,
    date:        new Date("2026-03-20T13:51:43"),
    entryPrice:  70.771,
    stopPrice:   70.151,
    tpPrice:     72.765,
    exitPrice:   70.147,
    pnlDollars:  -31.24,
    result:      "LOSS" as const,
  },
  {
    id:          "imp-1192457",
    instrument:  "BTCUSD",
    direction:   "LONG"  as const,
    date:        new Date("2026-02-01T21:01:01"),
    entryPrice:  77080.2,
    stopPrice:   76534.2,
    tpPrice:     78365.2,
    exitPrice:   76530.8,
    pnlDollars:  -5.87,
    result:      "LOSS" as const,
  },
  {
    id:          "imp-1084092",
    instrument:  "ETHUSD",
    direction:   "SHORT" as const,
    date:        new Date("2025-12-30T08:11:01"),
    entryPrice:  2999.47,
    stopPrice:   3050,      // stop above entry for SHORT (original data unclear)
    tpPrice:     2851,
    exitPrice:   2966.58,
    pnlDollars:  57.94,
    result:      "WIN" as const,
  },
  {
    id:          "imp-1084093",
    instrument:  "ETHUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-12-30T08:11:01"),
    entryPrice:  2966.58,
    stopPrice:   null as unknown as number,
    tpPrice:     null as unknown as number,
    exitPrice:   2966.85,
    pnlDollars:  -0.6,
    result:      "BE" as const,
  },
  {
    id:          "imp-1033273",
    instrument:  "EURUSD",
    direction:   "SHORT" as const,
    date:        new Date("2025-12-10T13:19:18"),
    entryPrice:  1.16445,
    stopPrice:   1.16845,
    tpPrice:     1.15105,
    exitPrice:   1.16297,
    pnlDollars:  14.4,
    result:      "WIN" as const,
  },
  {
    id:          "imp-1033485",
    instrument:  "EURUSD",
    direction:   "SHORT" as const,
    date:        new Date("2025-12-10T07:54:53"),
    entryPrice:  1.16445,
    stopPrice:   1.16845,
    tpPrice:     1.155,
    exitPrice:   1.16435,
    pnlDollars:  0.9,
    result:      "WIN" as const,
  },
  {
    id:          "imp-1030679",
    instrument:  "XRPUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-12-09T04:36:12"),
    entryPrice:  2.0539,
    stopPrice:   2.0184,
    tpPrice:     2.153,
    exitPrice:   2.1534,
    pnlDollars:  275.65,
    result:      "WIN" as const,
  },
  {
    id:          "imp-1030129",
    instrument:  "SOLUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-12-08T18:58:05"),
    entryPrice:  133,
    stopPrice:   129.5,
    tpPrice:     133.2,
    exitPrice:   133.2302,
    pnlDollars:  1.51,
    result:      "WIN" as const,
  },
  {
    id:          "imp-1005583",
    instrument:  "ETHUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-12-01T00:46:39"),
    entryPrice:  2854.6818,
    stopPrice:   2749.682,
    tpPrice:     3074.682,
    exitPrice:   2748.23,
    pnlDollars:  -53.93,
    result:      "LOSS" as const,
  },
  // ── Image 2 ──────────────────────────────────────────────────────────────
  {
    id:          "imp-1001669",
    instrument:  "BTCUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-11-29T20:03:04"),
    entryPrice:  90439.8,
    stopPrice:   90070,
    tpPrice:     91815,
    exitPrice:   91846.4,
    pnlDollars:  154.35,
    result:      "WIN" as const,
  },
  {
    id:          "imp-1000089",
    instrument:  "XAUUSD",
    direction:   "SHORT" as const,
    date:        new Date("2025-11-28T10:16:43"),
    entryPrice:  4175.15,
    stopPrice:   4212.15,
    tpPrice:     4050.15,
    exitPrice:   4212.15,
    pnlDollars:  -74.16,
    result:      "LOSS" as const,
  },
  {
    id:          "imp-980329",
    instrument:  "XAUUSD",
    direction:   "SHORT" as const,
    date:        new Date("2025-11-21T16:51:54"),
    entryPrice:  4096.51,
    stopPrice:   4136.51,
    tpPrice:     3820.78,
    exitPrice:   4085.9,
    pnlDollars:  10.53,
    result:      "WIN" as const,
  },
  {
    id:          "imp-984409",
    instrument:  "ETHUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-11-21T15:39:28"),
    entryPrice:  2690,
    stopPrice:   2610,
    tpPrice:     2950,
    exitPrice:   2801.65,
    pnlDollars:  43.21,
    result:      "WIN" as const,
  },
  {
    id:          "imp-1002847",
    instrument:  "ETHUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-11-21T15:39:28"),
    entryPrice:  2690,
    stopPrice:   2610,
    tpPrice:     3170,
    exitPrice:   2859.88,
    pnlDollars:  30.79,
    result:      "WIN" as const,
  },
  {
    id:          "imp-980330",
    instrument:  "XAUUSD",
    direction:   "SHORT" as const,
    date:        new Date("2025-11-19T23:51:13"),
    entryPrice:  4105.14,
    stopPrice:   4245.14,
    tpPrice:     3825.14,
    exitPrice:   4085.83,
    pnlDollars:  13.45,
    result:      "WIN" as const,
  },
  {
    id:          "imp-971568",
    instrument:  "BTCUSD",
    direction:   "LONG"  as const,
    date:        new Date("2025-11-19T16:04:20"),
    entryPrice:  89991,
    stopPrice:   89171,
    tpPrice:     90001,
    exitPrice:   89169.12,
    pnlDollars:  -86.67,
    result:      "LOSS" as const,
  },
  {
    id:          "imp-976998",
    instrument:  "XAGUSD",
    direction:   "SHORT" as const,
    date:        new Date("2025-11-19T10:08:17"),
    entryPrice:  52.4,
    stopPrice:   53.35,
    tpPrice:     49.52,
    exitPrice:   49.511,
    pnlDollars:  144.36,
    result:      "WIN" as const,
  },
];

async function main() {
  console.log(`📥 ${trades.length} trade import ediliyor…\n`);

  for (const t of trades) {
    const rResult = calcR(t.direction, t.entryPrice, t.stopPrice, t.exitPrice);
    const marketGroup = mktGroup(t.instrument);

    await prisma.trade.upsert({
      where:  { id: t.id },
      update: {},
      create: {
        id:           t.id,
        userId:       USER_ID,
        date:         t.date,
        instrument:   t.instrument,
        marketGroup,
        triad:        triad(t.instrument),
        session:      "NY_AM",
        direction:    t.direction,
        setupType:    "CUSTOM",
        entryModel:   "MARKET",
        nearNews:     false,
        entryPrice:   t.entryPrice,
        stopPrice:    t.stopPrice ?? undefined,
        tp1:          t.tpPrice ?? undefined,
        rResult:      rResult ?? undefined,
        pnlCurrency:  t.pnlDollars,
        result:       t.result,
        processGrade: "UNREVIEWED",
      },
    });

    const sign = t.pnlDollars >= 0 ? "+" : "";
    console.log(
      `  ${t.result === "WIN" ? "✅" : t.result === "BE" ? "⚪" : "❌"} ${t.instrument.padEnd(8)} ${t.direction.padEnd(6)} ${sign}$${t.pnlDollars.toFixed(2).padStart(8)}  R: ${rResult != null ? rResult.toFixed(2) : "—"}`
    );
  }

  const wins   = trades.filter((t) => t.result === "WIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const total  = trades.filter((t) => t.result !== "BE").length;
  const totalPnl = trades.reduce((s, t) => s + t.pnlDollars, 0);

  console.log(`\n📊 Özet`);
  console.log(`   ${wins} kazanç / ${losses} kayıp / ${trades.length - wins - losses} BE`);
  console.log(`   Win rate: ${((wins / total) * 100).toFixed(0)}%`);
  console.log(`   Toplam P&L: ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`);
  console.log("\n✨ Tüm trade'ler journal'a eklendi.");
}

main()
  .catch((e) => { console.error("❌", e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
