import { describe, it, expect } from "vitest";
import { CARRY_OVER_FIELDS, applyCarryOver, carriedFieldKeys, type PrepCarryOver } from "./carry-over";
import { createEmptyPrepForm, type PrepFormData } from "@/app/(app)/daily-prep/new/types";

/** Gerçekçi bir "dünkü prep" — taşınabilecek her alan dolu. */
const LAST_PREP: PrepCarryOver = {
  session: "NY_AM",
  marketGroup: "INDICES",
  triad: "NQ_ES_YM",
  primaryInstrument: "NQ",
  secondaryInstruments: ["ES", "YM"],
  htfBias: "LONG",
  htfBiasConfidence: "HIGH",
  htfInvalidation: "21000 altı kapanış",
  htfBiasExplanation: "Haftalık Q2 discount'tan tepki",
  weeklyPo3State: "ACCUMULATION",
  dailyPo3State: "MANIPULATION",
  mmxmStage: "SMART_MONEY_REVERSAL",
  mainLiquidityTarget: "PREV_DAY_HIGH",
  customLiqTarget: "",
};

/**
 * Taşınmaması gereken alanlar. CARRY_OVER_FIELDS ile birleşimi
 * PrepFormData'nın tamamını vermeli — aşağıdaki bütünlük testi bunu zorlar.
 */
const EXCLUDED_FIELDS = [
  "newsEvents",
  "activeCycleWeekly",
  "activeCycleDaily",
  "active90mCycle",
  "activeMicroCycle",
  "q1Quality",
  "expectedBehavior",
  "trueOpens",
  "currentPrice",
  "dfr",
  "ssmt",
  "confirmation",
  "entry",
  "goNoGoStatus",
  "goNoGoReason",
  "notes",
  "autoFilled",
] as const;

describe("CARRY_OVER_FIELDS — bütünlük", () => {
  it("taşınan ∪ taşınmayan === PrepFormData'nın tüm alanları", () => {
    const covered = [...CARRY_OVER_FIELDS, ...EXCLUDED_FIELDS].sort();
    const actual = Object.keys(createEmptyPrepForm()).sort();
    // Yeni bir alan eklenip ikisine de yazılmazsa bu test kırılır: yeni alanın
    // taşınıp taşınmayacağı bilinçli bir karar olmalı.
    expect(covered).toEqual(actual);
  });

  it("taşınan ve taşınmayan listeleri kesişmez", () => {
    const overlap = CARRY_OVER_FIELDS.filter((f) => (EXCLUDED_FIELDS as readonly string[]).includes(f));
    expect(overlap).toEqual([]);
  });
});

describe("applyCarryOver", () => {
  const result = applyCarryOver(createEmptyPrepForm(), LAST_PREP);

  it("yavaş değişen bağlamı taşır", () => {
    expect(result.session).toBe("NY_AM");
    expect(result.triad).toBe("NQ_ES_YM");
    expect(result.primaryInstrument).toBe("NQ");
    expect(result.secondaryInstruments).toEqual(["ES", "YM"]);
  });

  it("HTF anlatısını taşır (kullanıcı kararı: rozetle işaretlenip taşınır)", () => {
    expect(result.htfBias).toBe("LONG");
    expect(result.htfBiasExplanation).toBe("Haftalık Q2 discount'tan tepki");
    expect(result.htfInvalidation).toBe("21000 altı kapanış");
    expect(result.htfBiasConfidence).toBe("HIGH");
  });

  it.each(EXCLUDED_FIELDS.map((f) => [f]))("%s taşınmaz", (field) => {
    const empty = createEmptyPrepForm();
    expect(result[field as keyof PrepFormData]).toEqual(empty[field as keyof PrepFormData]);
  });

  it("güne özgü karar alanları boş kalır", () => {
    expect(result.goNoGoStatus).toBe("");
    expect(result.entry.entryPrice).toBe("");
    expect(result.trueOpens.TYO.price).toBe("");
    expect(result.newsEvents).toEqual([]);
  });

  it("boş gelen alan formdaki mevcut değeri silmez", () => {
    const base = { ...createEmptyPrepForm(), primaryInstrument: "ES" };
    const next = applyCarryOver(base, { primaryInstrument: "", htfBias: "SHORT" });
    expect(next.primaryInstrument).toBe("ES");
    expect(next.htfBias).toBe("SHORT");
  });

  it("secondaryInstruments kopyalanır, referans paylaşılmaz", () => {
    expect(result.secondaryInstruments).not.toBe(LAST_PREP.secondaryInstruments);
  });

  it("girdi formunu mutasyona uğratmaz", () => {
    const base = createEmptyPrepForm();
    applyCarryOver(base, LAST_PREP);
    expect(base.primaryInstrument).toBe("");
  });
});

describe("carriedFieldKeys", () => {
  it("yalnızca dolu alanları listeler", () => {
    const keys = carriedFieldKeys({ primaryInstrument: "NQ", customLiqTarget: "", secondaryInstruments: [] });
    expect(keys).toEqual(["primaryInstrument"]);
  });

  it("tam bir kayıtta boş olan alan hariç hepsini döner", () => {
    // LAST_PREP'te yalnızca customLiqTarget boş.
    expect(carriedFieldKeys(LAST_PREP)).toEqual(
      CARRY_OVER_FIELDS.filter((f) => f !== "customLiqTarget"),
    );
  });
});
