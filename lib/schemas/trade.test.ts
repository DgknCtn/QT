import { describe, it, expect } from "vitest";
import { assertValidTrade } from "./trade";

describe("assertValidTrade", () => {
  it("accepts a well-formed LONG trade", () => {
    expect(() =>
      assertValidTrade({ direction: "LONG", entryPrice: "20100", stopPrice: "20050", riskPercent: "1" })
    ).not.toThrow();
  });

  it("accepts a well-formed SHORT trade", () => {
    expect(() =>
      assertValidTrade({ direction: "SHORT", entryPrice: "20100", stopPrice: "20150", riskPercent: "1" })
    ).not.toThrow();
  });

  it("allows empty optional fields (NO_TRADE / draft rows)", () => {
    expect(() => assertValidTrade({})).not.toThrow();
    expect(() =>
      assertValidTrade({ direction: "LONG", entryPrice: "", stopPrice: "", riskPercent: "" })
    ).not.toThrow();
  });

  describe("stop placement", () => {
    it("rejects a LONG whose stop sits above entry", () => {
      expect(() =>
        assertValidTrade({ direction: "LONG", entryPrice: "20100", stopPrice: "20150" })
      ).toThrow(/LONG/);
    });

    it("rejects a SHORT whose stop sits below entry", () => {
      expect(() =>
        assertValidTrade({ direction: "SHORT", entryPrice: "20100", stopPrice: "20050" })
      ).toThrow(/SHORT/);
    });

    it("skips the direction check when stop equals entry (breakeven)", () => {
      expect(() =>
        assertValidTrade({ direction: "LONG", entryPrice: "20100", stopPrice: "20100" })
      ).not.toThrow();
    });

    it("ignores stop placement when direction is unknown", () => {
      expect(() => assertValidTrade({ entryPrice: "20100", stopPrice: "20150" })).not.toThrow();
    });
  });

  describe("positive-price rules", () => {
    it("rejects a non-positive entry price", () => {
      expect(() => assertValidTrade({ entryPrice: "0" })).toThrow();
      expect(() => assertValidTrade({ entryPrice: "-5" })).toThrow();
    });

    it("rejects a non-positive stop price", () => {
      expect(() => assertValidTrade({ stopPrice: "0" })).toThrow();
    });
  });

  describe("risk percent bounds", () => {
    it("rejects negative risk", () => {
      expect(() => assertValidTrade({ riskPercent: "-1" })).toThrow();
    });

    it("rejects risk above 100", () => {
      expect(() => assertValidTrade({ riskPercent: "101" })).toThrow();
    });

    it("accepts the 0 and 100 boundaries", () => {
      expect(() => assertValidTrade({ riskPercent: "0" })).not.toThrow();
      expect(() => assertValidTrade({ riskPercent: "100" })).not.toThrow();
    });
  });

  it("accepts numbers as well as form strings", () => {
    expect(() =>
      assertValidTrade({ direction: "LONG", entryPrice: 20100, stopPrice: 20050 })
    ).not.toThrow();
  });
});

describe("sayısal doğrulama sıkılığı", () => {
  it("tamamen sayısal olmayan girdiyi reddeder", () => {
    // Eskiden parseFloat("abc") -> NaN -> null'a düşüyor ve "alan boş"
    // sayılıyordu: risk-kritik bir stop fiyatı sessizce kayboluyordu.
    expect(() => assertValidTrade({ entryPrice: "abc" })).toThrow(/Geçersiz sayı/);
  });

  it("sayıyla başlayan çöp girdiyi reddeder", () => {
    // parseFloat("100abc") 100 döndürüyordu — kullanıcının yazdığından
    // farklı bir değeri sessizce kaydetmek en kötü sonuç.
    expect(() => assertValidTrade({ entryPrice: "100abc" })).toThrow(/Geçersiz sayı/);
  });

  it("boş opsiyonel alan hâlâ geçerli", () => {
    expect(() => assertValidTrade({ entryPrice: "", stopPrice: undefined })).not.toThrow();
    expect(() => assertValidTrade({})).not.toThrow();
  });

  it("geçerli sayı biçimlerini kabul eder", () => {
    expect(() => assertValidTrade({ entryPrice: "20100.25" })).not.toThrow();
    expect(() => assertValidTrade({ entryPrice: ".5" })).not.toThrow();
    expect(() => assertValidTrade({ entryPrice: 20100 })).not.toThrow();
  });
});
