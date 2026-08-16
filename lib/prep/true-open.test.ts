import { describe, it, expect } from "vitest";
import { deriveTrueOpen, toleranceFor, parsePrice } from "./true-open";

describe("deriveTrueOpen", () => {
  it.each([
    ["fiyat üstünde", 21050, 21000, "ABOVE", "PREMIUM"],
    ["fiyat altında", 20950, 21000, "BELOW", "DISCOUNT"],
    ["birebir eşit", 21000, 21000, "AT", "NEUTRAL"],
  ])("%s", (_label, current, open, position, interpretation) => {
    expect(deriveTrueOpen(current as number, open as number)).toEqual({ position, interpretation });
  });

  it("premium yönü Adım 10'un varsayımıyla aynı (üstü ⇒ premium ⇒ short-favorable)", () => {
    expect(deriveTrueOpen(21050, 21000).interpretation).toBe("PREMIUM");
  });

  describe("tolerans", () => {
    it("tam tolerans sınırı AT sayılır", () => {
      expect(deriveTrueOpen(21000.25, 21000, 0.25).position).toBe("AT");
      expect(deriveTrueOpen(20999.75, 21000, 0.25).position).toBe("AT");
    });

    it("toleransın bir adım dışı yön üretir", () => {
      expect(deriveTrueOpen(21000.26, 21000, 0.25).position).toBe("ABOVE");
      expect(deriveTrueOpen(20999.74, 21000, 0.25).position).toBe("BELOW");
    });

    it("tolerans verilmezse sadece birebir eşitlik AT'dir", () => {
      expect(deriveTrueOpen(21000.01, 21000).position).toBe("ABOVE");
    });
  });

  it("negatif fiyatlarda da yön doğru", () => {
    expect(deriveTrueOpen(-5, -10).position).toBe("ABOVE");
    expect(deriveTrueOpen(-15, -10).position).toBe("BELOW");
  });
});

describe("toleranceFor", () => {
  it.each([
    ["NQ", 0.25],
    ["nq", 0.25],
    [" ES ", 0.25],
    ["YM", 1],
    ["EURUSD", 0.0001],
    ["BTC", 1],
  ])("%s → %s", (instrument, expected) => {
    expect(toleranceFor(instrument as string)).toBe(expected);
  });

  it.each([[undefined], [null], [""], ["BİLİNMEYEN"]])("%s → 0", (instrument) => {
    expect(toleranceFor(instrument as string | undefined | null)).toBe(0);
  });
});

describe("parsePrice", () => {
  it.each([
    ["21000", 21000],
    [" 21000.25 ", 21000.25],
    ["-5", -5],
  ])("%s → %s", (input, expected) => {
    expect(parsePrice(input as string)).toBe(expected);
  });

  it.each([[""], ["   "], ["abc"], ["-"], [undefined], [null]])(
    "%s → null (satır olduğu gibi bırakılır)",
    (input) => {
      expect(parsePrice(input as string | undefined | null)).toBeNull();
    },
  );

  it("0 geçerli bir fiyattır, null değil", () => {
    expect(parsePrice("0")).toBe(0);
  });
});
