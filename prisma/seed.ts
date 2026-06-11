/**
 * Seed script — one example record per module.
 * Run: npx dotenv-cli -e .env -- npx tsx prisma/seed.ts
 */
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const USER_ID = "fdbe609d-f687-4b34-bebf-7ea6e78812d6";

function d(offsetDays = 0, hours = 9, minutes = 30) {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

async function main() {
  console.log("🌱 Seeding example records…\n");

  // ─── 1. Daily Prep ────────────────────────────────────────────────────────
  const prep = await prisma.dailyPrep.upsert({
    where:  { id: "seed-daily-prep-001" },
    update: {},
    create: {
      id:          "seed-daily-prep-001",
      userId:      USER_ID,
      date:        d(0),
      session:     "NY_AM",
      marketGroup: "INDICES",
      triad:       "NQ_ES_YM",
      primaryInstrument: "NQ",

      htfBias:           "LONG",
      htfBiasConfidence: "HIGH",
      htfTarget:         "Weekly High — 19520",
      htfBiasExplanation:"Daily structure bullish. Monday swept prev week low. Price above Weekly Open. Expecting continuation to Weekly High.",

      weeklyPo3State: "DISTRIBUTION",
      dailyPo3State:  "MANIPULATION",
      mmxmStage:      "CONTINUATION",

      activeCycleWeekly: "TUESDAY_Q2",
      activeCycleDaily:  "NY_AM",
      active90mCycle:    "Q1",
      activeMicroCycle:  "Q1",
      q1Quality:         "CLEAN_ACCUMULATION",
      expectedBehavior:  "EXPANSION",
      mainLiquidityTarget: "PREV_WEEK_HIGH",

      trueOpenSummary: {
        weekly:   { price: 19320, position: "ABOVE", note: "Bullish — holding above weekly open" },
        daily:    { price: 19390, position: "ABOVE", note: "Daily bias long confirmed" },
        nyOpen:   { price: 19410, position: "ABOVE", note: "NY open aligns with daily" },
        london:   { price: 19380, position: "ABOVE", note: "London open bullish confluence" },
        asia:     { price: 19340, position: "ABOVE", note: "Asia range below — full stack" },
        midnight: { price: 19355, position: "ABOVE", note: "All 6 opens bullish — max conviction" },
      },

      dfrSummary: {
        type:    "DAILY_ADFR",
        high:    19440,
        low:     19350,
        mid:     19395,
        quality: "HIGH",
        note:    "Price reacted from DFR low. Mid at 19395 cleared — bullish.",
      },

      ssmtSummary: {
        formed:       true,
        type:         "STANDARD_SSMT",
        location:     "PREV_DAY_HIGH",
        strongAsset:  "NQ",
        weakAsset:    "YM",
        randomSmt:    false,
        note:         "NQ swept prev day high; ES failed to confirm. Classic SMT divergence — expect NQ pullback then continuation.",
      },

      confirmationSummary: {
        type:      "FVG_REACTION",
        timeframe: "M5",
        note:      "Wait for M5 FVG to form after NY open liquidity sweep before entry.",
      },

      newsSummary: {
        events: [
          { time: "10:00", currency: "USD", name: "ISM Manufacturing PMI", risk: "WATCH" },
        ],
        note: "Low impact today. No full no-trade window needed.",
      },

      goNoGoStatus: "GO",
      goNoGoReason: "All 6 True Opens bullish. DFR mid cleared. SMT divergence formed. Confirmation model ready. GO.",
      completionScore: 9.0,
      qualityScore:    8.5,
      isDraft:         false,
    },
  });
  console.log("✅ Daily Prep created:", prep.id);

  // ─── 2. Level ─────────────────────────────────────────────────────────────
  const level = await prisma.level.upsert({
    where:  { id: "seed-level-001" },
    update: {},
    create: {
      id:          "seed-level-001",
      userId:      USER_ID,
      dailyPrepId: prep.id,
      instrument:  "NQ",
      marketGroup: "INDICES",
      levelType:   "OB",
      price:       19375,
      timeframe:   "H1",
      status:      "ACTIVE",
      notes:       "H1 Bullish Order Block — last bearish candle before Monday impulse. Valid until price returns and holds above.",
    },
  });
  console.log("✅ Level created:", level.id);

  // ─── 3. DFR ───────────────────────────────────────────────────────────────
  const dfr = await prisma.dFR.upsert({
    where:  { id: "seed-dfr-001" },
    update: {},
    create: {
      id:               "seed-dfr-001",
      userId:           USER_ID,
      dailyPrepId:      prep.id,
      dfrType:          "DAILY_ADFR",
      timeframeAlignment: "DAILY",
      dfrHigh:          19440,
      dfrLow:           19350,
      dfrMid:           19395,
      q1Quality:        "EXPANSION",
      dfrQualityScore:  2,
      dfrQualityBand:   "HIGH",
      alignsWithBias:   true,
      nearPriorPoi:     true,
      notes:            "Daily ATR range 90pts. Mid at 19395 cleared bullish after London session.",
    },
  });
  console.log("✅ DFR created:", dfr.id);

  // ─── 4. SSMT Event ────────────────────────────────────────────────────────
  const ssmt = await prisma.sSMTEvent.upsert({
    where:  { id: "seed-ssmt-001" },
    update: {},
    create: {
      id:               "seed-ssmt-001",
      userId:           USER_ID,
      dailyPrepId:      prep.id,
      marketGroup:      "INDICES",
      triad:            "NQ_ES_YM",
      primaryInstrument:"NQ",
      ssmtType:         "STANDARD_SSMT",
      locationType:     "PREV_DAY_HIGH",
      timeframe:        "M5",
      strongAsset:      "NQ",
      weakAsset:        "YM",
      alignsWithBias:   "YES",
      randomSmtFlag:    false,
      notes:            "NQ swept Monday high at 09:42. ES stayed below its Monday high. Classic divergence — continuation long expected after pullback.",
    },
  });
  console.log("✅ SSMT Event created:", ssmt.id);

  // ─── 5. Confirmation ──────────────────────────────────────────────────────
  const conf = await prisma.confirmation.upsert({
    where:  { id: "seed-conf-001" },
    update: {},
    create: {
      id:               "seed-conf-001",
      userId:           USER_ID,
      dailyPrepId:      prep.id,
      ssmtEventId:      ssmt.id,
      confirmationType: "FVG_REACTION",
      timeframe:        "M5",
      tfAlignmentValid: "YES",
      entryRelevance:   "M5 FVG at 19405–19412 after 10:10 AM sweep. Entry on return to FVG.",
      notes:            "Waited for full M5 candle close inside FVG before entry.",
    },
  });
  console.log("✅ Confirmation created:", conf.id);

  // ─── 6. Trade (WIN) ───────────────────────────────────────────────────────
  const trade = await prisma.trade.upsert({
    where:  { id: "seed-trade-001" },
    update: {},
    create: {
      id:           "seed-trade-001",
      userId:       USER_ID,
      dailyPrepId:  prep.id,
      date:         d(0),
      instrument:   "NQ",
      marketGroup:  "INDICES",
      triad:        "NQ_ES_YM",
      session:      "NY_AM",
      direction:    "LONG",
      setupType:    "CONTINUATION",
      entryModel:   "FVG_GAP_REACTION",
      stopLogic:    "GAP_FVG_INVALIDATION",
      entryPrice:   19412,
      stopPrice:    19365,
      tp1:          19480,
      tp2:          19520,
      riskPercent:  1.0,
      rResult:      2.1,
      pnlPoints:    68,
      result:       "WIN",
      planFollowed: "YES",
      goStatusAtEntry: "GO",
      processScore: 12,
      processGrade: "A_PLUS",
      notes:        "Textbook NY AM setup. Waited for 10:00 liquidity sweep, got M5 FVG entry at 19412. Held to TP1 at 19480, trailed rest. Clean A+ execution.",
    },
  });

  // Tags for win trade
  for (const [name, cat] of [
    ["Waited for confirmation", "POSITIVE"],
    ["Followed plan exactly",   "POSITIVE"],
    ["Correct position sizing", "POSITIVE"],
  ] as const) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: USER_ID, name } },
      update: {},
      create: { userId: USER_ID, name, category: cat },
    });
    await prisma.tradeTag.upsert({
      where: { tradeId_tagId: { tradeId: trade.id, tagId: tag.id } },
      update: {},
      create: { tradeId: trade.id, tagId: tag.id },
    });
  }
  console.log("✅ Trade (WIN) created:", trade.id);

  // ─── 7. Trade (LOSS) — for analytics contrast ────────────────────────────
  const trade2 = await prisma.trade.upsert({
    where:  { id: "seed-trade-002" },
    update: {},
    create: {
      id:          "seed-trade-002",
      userId:      USER_ID,
      date:        d(-1),
      instrument:  "ES",
      marketGroup: "INDICES",
      triad:       "NQ_ES_YM",
      session:     "NY_AM",
      direction:   "LONG",
      setupType:   "REVERSAL",
      entryModel:  "MARKET",
      entryPrice:  5185,
      stopPrice:   5170,
      tp1:         5210,
      riskPercent: 0.75,
      rResult:     -1.0,
      pnlPoints:   -15,
      result:      "LOSS",
      planFollowed:"NO",
      goStatusAtEntry: "GO",
      processScore: 4,
      processGrade: "C",
      notes:       "Entered before London close. No M15 structure shift confirmed. Widened stop manually then got stopped out on normal pullback.",
    },
  });

  for (const [name, cat] of [
    ["Early entry",         "MISTAKE"],
    ["Moved stop manually", "MISTAKE"],
    ["No confirmation TF",  "MISTAKE"],
  ] as const) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: USER_ID, name } },
      update: {},
      create: { userId: USER_ID, name, category: cat },
    });
    await prisma.tradeTag.upsert({
      where: { tradeId_tagId: { tradeId: trade2.id, tagId: tag.id } },
      update: {},
      create: { tradeId: trade2.id, tagId: tag.id },
    });
  }
  console.log("✅ Trade (LOSS) created:", trade2.id);

  // ─── 8. Economic Events ───────────────────────────────────────────────────
  const events = [
    {
      id:         "seed-event-001",
      dateTime:   d(0, 8, 30),
      currency:   "USD",
      eventName:  "CPI m/m",
      impact:     "HIGH" as const,
      userRiskTag:"NO_TRADE_WINDOW" as const,
      noTradeBeforeMinutes: 15,
      noTradeAfterMinutes:  30,
      notes:      "Core CPI. High vol. No trade 15min before / 30min after.",
    },
    {
      id:         "seed-event-002",
      dateTime:   d(2, 14, 0),
      currency:   "USD",
      eventName:  "FOMC Meeting Minutes",
      impact:     "HIGH" as const,
      userRiskTag:"HIGH_RISK" as const,
      noTradeBeforeMinutes: 30,
      noTradeAfterMinutes:  60,
      notes:      "Fed minutes. Avoid new entries. Can cause 50-100pt spike on NQ.",
    },
    {
      id:         "seed-event-003",
      dateTime:   d(4, 8, 30),
      currency:   "USD",
      eventName:  "NFP",
      impact:     "HIGH" as const,
      userRiskTag:"NO_TRADE_WINDOW" as const,
      noTradeBeforeMinutes: 30,
      noTradeAfterMinutes:  60,
      notes:      "Non-Farm Payroll. Friday killer. Full no-trade window.",
    },
    {
      id:         "seed-event-004",
      dateTime:   d(1, 10, 0),
      currency:   "USD",
      eventName:  "ISM Manufacturing PMI",
      impact:     "MEDIUM" as const,
      userRiskTag:"WATCH" as const,
      notes:      "Worth watching. 10-20pt spike possible but not a hard no-trade.",
    },
  ];

  for (const ev of events) {
    await prisma.economicEvent.upsert({
      where:  { id: ev.id },
      update: {},
      create: { ...ev, userId: USER_ID },
    });
  }
  console.log("✅ Economic Events created:", events.length);

  // ─── 9. Knowledge Base Concepts ──────────────────────────────────────────
  const concepts = [
    {
      id: "seed-concept-001",
      title: "True Open",
      category: "TRUE_OPENS" as const,
      confidenceLevel: "PRACTICING" as const,
      definition: "The price at the exact moment a session or candle begins. Used in QT to determine if price is trading above or below key reference points for each timeframe.",
      whyItMatters: "Price above True Open = bullish bias for that TF. Below = bearish. Stacking 4–6 True Opens in the same direction = maximum conviction.",
      whenToUse: "Every daily prep. Check Weekly, Daily, NY Open, London, Asia, and Midnight opens in order.",
      whenNotToUse: "Never use a single True Open in isolation. Need at least 3–4 aligned.",
      requiredConditions: "Price must be decisively above/below — not just 1–2 ticks.",
      commonMistakes: "Using official exchange open instead of True Open. Forcing bias when opens conflict.",
      userNotes: "I color-code: green = above, red = below. Stack all 6 on a notepad before prep.",
    },
    {
      id: "seed-concept-002",
      title: "Silver Bullet",
      category: "CONFIRMATION" as const,
      confidenceLevel: "COMFORTABLE" as const,
      definition: "A 3-candle kill zone entry model in 3 specific NY windows: 3–4 AM, 10–11 AM, 2–3 PM. Requires: liquidity sweep → FVG forms → price returns to FVG for entry.",
      whyItMatters: "Time-based filtering eliminates most random price action. When the model appears in the window with HTF alignment, win rate is high.",
      whenToUse: "After HTF bias confirmed. Within one of the 3 time windows. On M1 or M5 timeframe.",
      whenNotToUse: "Outside time windows. When HTF is neutral. Never chase a missed Silver Bullet.",
      requiredConditions: "1) Within time window. 2) Liquidity sweep visible on chart. 3) FVG forms on M1/M5 in HTF bias direction.",
      commonMistakes: "Entering on wrong side of FVG. Not waiting for candle close. Entering after window expires.",
      userNotes: "10–11 AM window is most reliable for NQ on trend days. I skip 2–3 PM unless bias is very strong.",
    },
    {
      id: "seed-concept-003",
      title: "DFR — Daily Fair Range",
      category: "DFR" as const,
      confidenceLevel: "LEARNING" as const,
      definition: "The expected daily price range based on ATR and session context. Defines a High, Low, and Mid for the day. Price above mid = bullish intraday; below = bearish.",
      whyItMatters: "Prevents chasing entries after price has moved 70%+ of the expected range. Sets realistic TP targets.",
      whenToUse: "Calculate at start of every daily prep. Use mid as intraday bias filter.",
      whenNotToUse: "High-impact news days when range can expand 3–5×. Recalculate after major structural breaks.",
      commonMistakes: "Ignoring DFR and taking entries when price has already moved 80%+ of range — low probability.",
    },
    {
      id: "seed-concept-004",
      title: "SMT Divergence",
      category: "SSMT_CORRELATION" as const,
      confidenceLevel: "COMFORTABLE" as const,
      definition: "When correlated assets fail to make the same structural high or low. NQ sweeps a high but ES doesn't (or vice versa). Signals institutional intent to reverse.",
      whyItMatters: "Shows where institutions are positioned against the obvious retail direction. One of the highest-probability reversal signals.",
      whenToUse: "After a liquidity sweep. Look for divergence on M5/M15. Must occur at a structurally significant level.",
      whenNotToUse: "In choppy, non-trending markets. 'Random SMT' — divergence with no structural significance.",
      requiredConditions: "Two correlated assets. One makes a new swing extreme. The other clearly does NOT confirm.",
      commonMistakes: "Calling SMT too early — wait for clear failure. Using assets with low correlation.",
      userNotes: "NQ vs ES is my primary pair. NQ leads, ES lags. If NQ fails to confirm ES high = look for NQ short.",
    },
    {
      id: "seed-concept-005",
      title: "HTF Narrative & Bias",
      category: "BIAS_NARRATIVE" as const,
      confidenceLevel: "PRACTICING" as const,
      definition: "The directional expectation for the session, established by reading Weekly → Daily → H4. Answers: what is the market most likely to do today based on structure, liquidity, and PO3 cycle?",
      whyItMatters: "Trading against HTF bias is the #1 cause of consistent losses. Bias is your filter, not your entry trigger.",
      whenToUse: "Before every session. Review top-down: Weekly structure → Daily structure → identify liquidity pools.",
      whenNotToUse: "Do not force a bias on chop days. Mark NEUTRAL and wait for clarity.",
      commonMistakes: "Changing bias intraday on a single M5 candle. HTF bias only changes on Daily close.",
    },
    {
      id: "seed-concept-006",
      title: "Order Block",
      category: "QT_BASICS" as const,
      confidenceLevel: "COMFORTABLE" as const,
      definition: "The last opposing candle before a strong impulsive move. Bullish OB = last bearish candle before bullish impulse. Price often returns to these zones to fill remaining institutional orders.",
      whyItMatters: "Represents where institutions entered. When price returns, unfilled orders create high-probability support/resistance zones.",
      whenToUse: "After HTF bias confirmed + liquidity sweep. Identify OB on entry TF (H1, M15, M5) in bias direction.",
      whenNotToUse: "OBs that have already been retested and broken. Always check freshness.",
      requiredConditions: "Strong impulse away from OB. OB must be 'fresh' (first touch). HTF alignment required.",
      commonMistakes: "Using violated OBs. Entering without HTF confluence. Using body instead of wick for OB range.",
    },
    {
      id: "seed-concept-007",
      title: "1% Risk Rule",
      category: "RISK_EXECUTION" as const,
      confidenceLevel: "MASTERED" as const,
      definition: "Never risk more than 1% of total account on a single trade. Stop placement defines entry risk → position size is calculated from that. Never size up to make a larger profit.",
      whyItMatters: "10 losses at 1% = 10% drawdown. At 5% = 40% drawdown. Consistent sizing = consistent psychology.",
      whenToUse: "Every trade. No exceptions. 0.75% on high-impact news days, 1% standard.",
      whenNotToUse: "Never exceed 2% regardless of conviction. Never revenge-trade by increasing size.",
      requiredConditions: "Defined stop loss before entry. Size = (Account × 0.01) / (Entry − Stop in $ per unit).",
      commonMistakes: "Tight stops to 'risk less' → stopped out by normal noise. Widening stops post-entry to avoid loss.",
      userNotes: "0.75% on FOMC/CPI days. Tracking this religiously — discipline here is what separates accounts.",
    },
  ];

  for (const c of concepts) {
    await prisma.concept.upsert({
      where:  { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log("✅ Knowledge Concepts created:", concepts.length);

  console.log("\n✨ Done! All modules now have example records.");
}

main()
  .catch((e) => { console.error("\n❌ Seed failed:", e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
