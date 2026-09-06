import { describe, it, expect } from "vitest";
import { createEmptyPrepForm, type PrepFormData } from "@/app/(app)/daily-prep/new/types";
import { evaluateGoBlockers, assertDecisionAllowed } from "./go-rules";

/** 15:30'da NO_TRADE_WINDOW etiketli bir haber. */
function nfp() {
  return {
    id: "1", eventName: "NFP", time: "15:30", currency: "USD",
    impact: "HIGH", riskTag: "NO_TRADE_WINDOW", notes: "",
  };
}

/** GO'ya izin veren, eksiksiz bir prep. */
function validGoPrep(): PrepFormData {
  const d = createEmptyPrepForm();
  d.htfBias = "LONG";
  d.htfBiasExplanation = "Haftalık Q2 discount'tan tepki";
  d.ssmt.formed = "YES";
  d.entry.entryModel = "FVG";
  d.entry.stopPrice = "20980";
  d.entry.riskPercent = "1";
  return d;
}

describe("evaluateGoBlockers", () => {
  it("eksiksiz prep'te GO açık", () => {
    const e = evaluateGoBlockers(validGoPrep());
    expect(e.hardBlocks).toEqual([]);
    expect(e.canGo).toBe(true);
    expect(e.allowedDecisions).toContain("GO");
  });

  it("stop silinince GO kapanır", () => {
    const d = validGoPrep();
    d.entry.stopPrice = "";
    const e = evaluateGoBlockers(d);
    expect(e.canGo).toBe(false);
    expect(e.hardBlocks).toContain("No stop defined");
    expect(e.allowedDecisions).not.toContain("GO");
  });

  it("narrative eksikse GO kapanır", () => {
    const d = validGoPrep();
    d.htfBiasExplanation = "";
    expect(evaluateGoBlockers(d).canGo).toBe(false);
  });

  it("yönlü fikirde SSMT yoksa GO kapanır", () => {
    const d = validGoPrep();
    d.ssmt.formed = "NO";
    expect(evaluateGoBlockers(d).hardBlocks).toContain(
      "No SSMT / crack on directional idea (reversal risk)"
    );
  });

  it("long fikir premium bağlamla çelişirse GO kapanır", () => {
    const d = validGoPrep();
    d.trueOpens = {
      TYO: { price: "21000", position: "ABOVE", interpretation: "PREMIUM", notes: "" },
      TDO: { price: "20900", position: "ABOVE", interpretation: "PREMIUM", notes: "" },
    };
    expect(evaluateGoBlockers(d).canGo).toBe(false);
  });

  it("planlanan giriş saati yoksa engel korunur, sebebi söylenir", () => {
    const d = validGoPrep();
    d.newsEvents = [nfp()];
    const e = evaluateGoBlockers(d);
    expect(e.canGo).toBe(false);
    expect(e.hardBlocks.join(" ")).toMatch(/giriş saatini gir/i);
  });

  it("giriş haberin penceresi içindeyse hard NO-GO", () => {
    const d = validGoPrep();
    d.newsEvents = [nfp()];
    d.entry.plannedEntryTime = "15:45"; // 15:30'a 15 dk
    const e = evaluateGoBlockers(d);
    expect(e.canGo).toBe(false);
    expect(e.hardBlocks.join(" ")).toMatch(/15 dk mesafede/);
  });

  it("giriş pencere dışındaysa engel yok — asıl regresyon", () => {
    // Eskiden yalnizca haberin ETIKETI engel uretiyordu: aradaki mesafe ne
    // olursa olsun gun boyu GO kapaliydi.
    const d = validGoPrep();
    d.newsEvents = [nfp()];
    d.entry.plannedEntryTime = "10:00"; // 15:30'a 5.5 saat
    expect(evaluateGoBlockers(d).canGo).toBe(true);
  });

  it("pencere sınırında (tam 30 dk) hâlâ engel", () => {
    const d = validGoPrep();
    d.newsEvents = [nfp()];
    d.entry.plannedEntryTime = "16:00";
    expect(evaluateGoBlockers(d).canGo).toBe(false);
  });

  it("haberin saati bilinmiyorsa gün boyu engel gibi davranır", () => {
    const d = validGoPrep();
    d.newsEvents = [{ ...nfp(), time: "" }];
    d.entry.plannedEntryTime = "10:00";
    expect(evaluateGoBlockers(d).canGo).toBe(false);
  });

  it("giriş planı yoksa haber engeli aranmaz", () => {
    const d = validGoPrep();
    d.newsEvents = [nfp()];
    d.entry.entryModel = "NO_ENTRY";
    // NO_ENTRY'de stop/risk zorunlulugu da dusuyor.
    expect(evaluateGoBlockers(d).hardBlocks.join(" ")).not.toMatch(/NFP/);
  });

  it("GO engelliyken diğer kararlar hâlâ seçilebilir", () => {
    const d = validGoPrep();
    d.entry.stopPrice = "";
    const e = evaluateGoBlockers(d);
    expect(e.allowedDecisions).toEqual(["WAIT", "NO_GO", "REVIEW_LATER", "MISSED_SETUP"]);
  });
});

describe("assertDecisionAllowed — sunucu kapısı", () => {
  it("geçerli GO'yu kabul eder", () => {
    expect(() => assertDecisionAllowed(validGoPrep(), "GO")).not.toThrow();
  });

  it("ön koşulu bozulmuş GO'yu reddeder — asıl regresyon", () => {
    // Kullanıcı GO seçtikten sonra geri dönüp stop'u sildi; state'te GO kaldı.
    const d = validGoPrep();
    d.entry.stopPrice = "";
    expect(() => assertDecisionAllowed(d, "GO")).toThrow(/GO kaydedilemez/);
  });

  it("bloklar varken NO-GO kaydedilebilir", () => {
    const d = validGoPrep();
    d.entry.stopPrice = "";
    expect(() => assertDecisionAllowed(d, "NO_GO")).not.toThrow();
  });

  it("bilinmeyen karar değerini reddeder", () => {
    expect(() => assertDecisionAllowed(validGoPrep(), "DEFINITELY_GO")).toThrow(/Geçersiz karar/);
  });
});
