export type TrueOpenEntry = {
  price: string;
  position: string; // ABOVE | BELOW | AT
  interpretation: string; // PREMIUM | DISCOUNT | NEUTRAL
  notes: string;
};

export type NewsEvent = {
  id: string;
  eventName: string;
  time: string;
  currency: string;
  impact: string;
  riskTag: string;
  notes: string;
};

export type PrepFormData = {
  // Step 1
  session: string;
  marketGroup: string;
  triad: string;
  primaryInstrument: string;
  secondaryInstruments: string[];
  // Step 2
  htfBias: string;
  htfBiasConfidence: string;
  htfTarget: string;
  htfInvalidation: string;
  htfBiasExplanation: string;
  weeklyPo3State: string;
  dailyPo3State: string;
  mmxmStage: string;
  mainLiquidityTarget: string;
  customLiqTarget: string;
  // Step 3
  newsEvents: NewsEvent[];
  // Step 4
  activeCycleWeekly: string;
  activeCycleDaily: string;
  active90mCycle: string;
  activeMicroCycle: string;
  q1Quality: string;
  expectedBehavior: string;
  // Step 5
  trueOpens: Record<string, TrueOpenEntry>;
  // Step 6
  dfr: {
    dfrType: string;
    dfrHigh: string;
    dfrLow: string;
    dfrMid: string;
    q1Quality: string;
    highLowEqualsQ1: string;
    alignsWithBias: boolean;
    nearPriorPoi: boolean;
    notes: string;
  };
  // Step 7
  ssmt: {
    formed: string;
    ssmtType: string;
    locationType: string;
    locationPrice: string;
    timeframe: string;
    assetABehavior: string;
    assetBBehavior: string;
    assetCBehavior: string;
    strongAsset: string;
    weakAsset: string;
    alignsWithBias: string;
    randomSmtFlag: boolean;
    notes: string;
  };
  // Step 8
  confirmation: {
    confirmationType: string;
    timeframe: string;
    tfAlignmentValid: string;
    notes: string;
  };
  // Step 9
  entry: {
    entryModel: string;
    entryPrice: string;
    stopPrice: string;
    stopLogic: string;
    tp1: string;
    tp2: string;
    tp3: string;
    mainDol: string;
    riskPercent: string;
    riskUsd: string;
  };
  // Step 10
  goNoGoStatus: string;
  goNoGoReason: string;
  notes: string;
};
