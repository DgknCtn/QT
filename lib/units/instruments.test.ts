import { describe, it, expect } from "vitest";
import { INSTRUMENTS, positionSize, usdPerTick, usdPerPricePoint } from "./instruments";

describe("positionSize — forex", () => {
  it("EUR/USD: 100$ risk, 10 pip stop → ~1 standart lot", () => {
    const r = positionSize(INSTRUMENTS.EURUSD, 100, 1.1000, 1.0990)!;
    expect(r.qty).toBeCloseTo(1.0, 2);
    expect(r.qtyUnit).toBe("lot");
    expect(r.riskPerUnitUsd).toBeCloseTo(100, 6);
    expect(r.belowMinimum).toBe(false);
  });

  it("EUR/USD: risk bütçesi minimum lotu karşılamıyorsa işaretlenir", () => {
    // 20 pip stop, 1$ risk → 0.005 lot; minimum 0.01.
    const r = positionSize(INSTRUMENTS.EURUSD, 1, 1.1000, 1.0980)!;
    expect(r.qty).toBe(0);
    expect(r.belowMinimum).toBe(true);
  });

  it("USD/JPY: pip değeri sabit değil, kura göre USD'ye çevrilir", () => {
    // 155.00 kurda 1 lot için 1.0 fiyat hareketi = 100.000 JPY ≈ 645 USD.
    const perPoint = usdPerPricePoint(INSTRUMENTS.USDJPY, 155);
    expect(perPoint).toBeCloseTo(100_000 / 155, 6);
    // 10 pip = 0.10 → lot başına ~64.5$ risk. Ham miktar ~0.99975; adım 0.01
    // olduğu için 0.99'a **aşağı** yuvarlanır (bütçe aşılmasın diye).
    const r = positionSize(INSTRUMENTS.USDJPY, 64.5, 155.00, 154.90)!;
    expect(r.rawQty).toBeCloseTo(1.0, 2);
    expect(r.qty).toBe(0.99);
    expect(r.riskAtQtyUsd).toBeLessThanOrEqual(64.5);
  });
});

describe("positionSize — futures", () => {
  it("NQ: 200$ risk, 10 puan stop → 1 kontrat", () => {
    const r = positionSize(INSTRUMENTS.NQ, 200, 21000, 20990)!;
    expect(r.qty).toBe(1);
    expect(r.riskPerUnitUsd).toBe(200);
    expect(r.qtyUnit).toBe("contract");
  });

  it("bütçe 1 kontratı karşılamıyorsa aşağı yuvarlanır ve işaretlenir", () => {
    const r = positionSize(INSTRUMENTS.NQ, 100, 21000, 20990)!;
    expect(r.rawQty).toBeCloseTo(0.5, 6);
    expect(r.qty).toBe(0);
    expect(r.belowMinimum).toBe(true);
  });

  it("yukarı değil aşağı yuvarlar — bütçe asla aşılmaz", () => {
    const r = positionSize(INSTRUMENTS.NQ, 390, 21000, 20990)!;
    expect(r.qty).toBe(1);
    expect(r.riskAtQtyUsd).toBeLessThanOrEqual(390);
  });
});

describe("positionSize — crypto", () => {
  it("BTC: 100$ risk, 500$ stop mesafesi → 0.2 BTC", () => {
    const r = positionSize(INSTRUMENTS.BTC, 100, 60000, 59500)!;
    expect(r.qty).toBeCloseTo(0.2, 4);
    expect(r.unitLabel).toBe("BTC");
  });
});

describe("geçersiz girdiler", () => {
  it("stop entry'ye eşitse veya negatifse null döner", () => {
    expect(positionSize(INSTRUMENTS.NQ, 100, 21000, 21000)).toBeNull();
    expect(positionSize(INSTRUMENTS.NQ, 0, 21000, 20990)).toBeNull();
    expect(positionSize(INSTRUMENTS.NQ, 100, -1, 20990)).toBeNull();
  });
});

describe("usdPerTick türetilmiş değer", () => {
  it("futures tick değerleri sözleşme spesifikasyonuyla uyuşur", () => {
    expect(usdPerTick(INSTRUMENTS.NQ, 21000)).toBeCloseTo(5, 6);
    expect(usdPerTick(INSTRUMENTS.ES, 5800)).toBeCloseTo(12.5, 6);
    expect(usdPerTick(INSTRUMENTS.MNQ, 21000)).toBeCloseTo(0.5, 6);
  });

  it("forex tick (pip) değeri lot başına 10$ — eski tabloda 1$ yazıyordu", () => {
    expect(usdPerTick(INSTRUMENTS.EURUSD, 1.1)).toBeCloseTo(10, 6);
  });
});
