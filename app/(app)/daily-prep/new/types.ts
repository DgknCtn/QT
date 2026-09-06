export type TrueOpenEntry = {
  price: string;
  position: string; // ABOVE | BELOW | AT
  interpretation: string; // PREMIUM | DISCOUNT | NEUTRAL
  notes: string;
  /**
   * Kullanıcı bu satırın konumunu/yorumunu elle seçtiyse true olur ve satır
   * anlık fiyattan bir daha türetilmez. Taslakta ve Json özetinde saklanır.
   */
  manual?: boolean;
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
  /** Adım 5'te bir kez girilen anlık fiyat; premium/discount bundan türetilir. */
  currentPrice: string;
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
    /**
     * Planlanan giris saati (HH:mm, piyasa saati). Haber no-trade penceresinin
     * gercek bir zaman penceresi olarak degerlendirilebilmesi icin gerekli:
     * eskiden yalnizca haberin etiketi engel uretiyordu, girisin habere
     * uzakligi hic olculmuyordu.
     */
    plannedEntryTime: string;
  };
  // Step 10
  goNoGoStatus: string;
  goNoGoReason: string;
  notes: string;

  /**
   * Otomatik doldurulan / kopyalanan alanların anahtarları — yalnızca rozet
   * göstermek için. Veritabanına yazılmaz, sadece state ve taslakta yaşar.
   */
  autoFilled: string[];
};

/**
 * Boş form. Fabrika fonksiyonu, paylaşılan sabit değil: iç içe nesneler
 * (trueOpens, dfr, ssmt…) sabit olsaydı iki sihirbaz örneği aynı nesneyi
 * paylaşırdı.
 */
export function createEmptyPrepForm(): PrepFormData {
  return {
    // Step 1
    session: "",
    marketGroup: "",
    triad: "",
    primaryInstrument: "",
    secondaryInstruments: [],
    // Step 2
    htfBias: "",
    htfBiasConfidence: "MEDIUM",
    htfInvalidation: "",
    htfBiasExplanation: "",
    weeklyPo3State: "UNKNOWN",
    dailyPo3State: "UNKNOWN",
    mmxmStage: "UNKNOWN",
    mainLiquidityTarget: "",
    customLiqTarget: "",
    // Step 3
    newsEvents: [],
    // Step 4
    activeCycleWeekly: "",
    activeCycleDaily: "",
    active90mCycle: "",
    activeMicroCycle: "",
    q1Quality: "",
    expectedBehavior: "",
    // Step 5
    trueOpens: {
      TYO: { price: "", position: "", interpretation: "", notes: "" },
      TMO: { price: "", position: "", interpretation: "", notes: "" },
      TWO: { price: "", position: "", interpretation: "", notes: "" },
      TDO: { price: "", position: "", interpretation: "", notes: "" },
      TSO: { price: "", position: "", interpretation: "", notes: "" },
      TMSO: { price: "", position: "", interpretation: "", notes: "" },
    },
    currentPrice: "",
    // Step 6
    dfr: {
      dfrType: "",
      dfrHigh: "",
      dfrLow: "",
      dfrMid: "",
      q1Quality: "",
      highLowEqualsQ1: "",
      alignsWithBias: false,
      nearPriorPoi: false,
      notes: "",
    },
    // Step 7
    ssmt: {
      formed: "",
      ssmtType: "",
      locationType: "",
      locationPrice: "",
      timeframe: "",
      assetABehavior: "",
      assetBBehavior: "",
      assetCBehavior: "",
      strongAsset: "",
      weakAsset: "",
      alignsWithBias: "",
      randomSmtFlag: false,
      notes: "",
    },
    // Step 8
    confirmation: {
      confirmationType: "",
      timeframe: "",
      tfAlignmentValid: "",
      notes: "",
    },
    // Step 9
    entry: {
      entryModel: "",
      entryPrice: "",
      stopPrice: "",
      stopLogic: "",
      tp1: "",
      tp2: "",
      tp3: "",
      mainDol: "",
      riskPercent: "",
      riskUsd: "",
      plannedEntryTime: "",
    },
    // Step 10
    goNoGoStatus: "",
    goNoGoReason: "",
    notes: "",
    autoFilled: [],
  };
}
