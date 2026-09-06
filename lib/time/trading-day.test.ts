import { describe, it, expect } from "vitest";
import {
  tradingDayKey,
  isSameTradingDay,
  tradingDayRange,
  dayKeyInZone,
  startOfZonedDay,
} from "./trading-day";

describe("tradingDayKey", () => {
  it("piyasa gününü ET'ye göre belirler, sunucunun saat dilimine göre değil", () => {
    // 21 Ağustos 01:00 UTC = 20 Ağustos 21:00 ET → hâlâ 20 Ağustos seansı.
    expect(tradingDayKey(new Date("2026-08-21T01:00:00Z"))).toBe("2026-08-20");
  });

  it("ET gün dönümünü doğru yerde geçer (yaz, UTC-4)", () => {
    expect(tradingDayKey(new Date("2026-08-21T03:59:00Z"))).toBe("2026-08-20");
    expect(tradingDayKey(new Date("2026-08-21T04:01:00Z"))).toBe("2026-08-21");
  });

  it("kışın (EST, UTC-5) sınır bir saat kayar", () => {
    expect(tradingDayKey(new Date("2026-01-21T04:59:00Z"))).toBe("2026-01-20");
    expect(tradingDayKey(new Date("2026-01-21T05:01:00Z"))).toBe("2026-01-21");
  });
});

describe("isSameTradingDay", () => {
  it("gece taşan pozisyonun açılış ve kapanışı farklı günlere düşebilir", () => {
    const open = new Date("2026-08-21T02:00:00Z");  // 20 Ağu 22:00 ET
    const close = new Date("2026-08-21T05:00:00Z"); // 21 Ağu 01:00 ET
    expect(isSameTradingDay(open, close)).toBe(false);
  });

  it("aynı seans içindeki iki anı aynı güne koyar", () => {
    expect(
      isSameTradingDay(new Date("2026-08-20T14:00:00Z"), new Date("2026-08-20T19:00:00Z"))
    ).toBe(true);
  });
});

describe("tradingDayRange", () => {
  it("ET gününü tam kapsayan mutlak sınırlar verir (yaz, UTC-4)", () => {
    const { start, end } = tradingDayRange(new Date("2026-08-20T18:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-20T04:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-21T03:59:59.999Z");
  });

  it("kışın sınırlar bir saat kayar — sabit offset varsayımı yok", () => {
    const { start } = tradingDayRange(new Date("2026-01-20T18:00:00Z"));
    expect(start.toISOString()).toBe("2026-01-20T05:00:00.000Z");
  });

  it("DST geçiş gününde de tutarlı sınır üretir", () => {
    // 2026'da ABD yaz saati 8 Mart'ta başlar: gün 23 saat sürer.
    const { start, end } = tradingDayRange(new Date("2026-03-08T18:00:00Z"));
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-09T03:59:59.999Z");
  });
});

describe("dayKeyInZone", () => {
  it("kullanıcının günü ile piyasanın günü farklı olabilir", () => {
    const t = new Date("2026-08-21T01:00:00Z");
    expect(dayKeyInZone(t, "Europe/Istanbul")).toBe("2026-08-21"); // kullanıcı
    expect(dayKeyInZone(t, "America/New_York")).toBe("2026-08-20"); // piyasa
  });
});

describe("startOfZonedDay", () => {
  it("gün anahtarını o saat dilimindeki ilk ana çevirir", () => {
    expect(startOfZonedDay("2026-08-20", "Europe/Istanbul").toISOString())
      .toBe("2026-08-19T21:00:00.000Z");
  });
});
