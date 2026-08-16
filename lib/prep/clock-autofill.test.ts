import { describe, it, expect } from "vitest";
import { computePrepAutoFill, getEtDayOfWeek, describeAutoFill } from "./clock-autofill";

/**
 * Fixtures use August 2026, when New York is on EDT (UTC-4), so `ET = UTC - 4`.
 * Reference calendar:
 *   2026-08-10 Pazartesi · 2026-08-13 Perşembe · 2026-08-14 Cuma
 *   2026-08-15 Cumartesi · 2026-08-16 Pazar
 *
 * Aynı desen `components/market-clock/use-market-clock.test.ts`'ten alındı.
 */
function etTime(day: number, hour: number, minute = 0): Date {
  const utcHour = hour + 4;
  const dayShift = Math.floor(utcHour / 24);
  return new Date(Date.UTC(2026, 7, day + dayShift, utcHour % 24, minute, 0));
}

// Prisma enum üyeleri — dönen her değerin bunlardan biri olduğu iddia edilir.
const SESSIONS = ["LONDON", "NY_AM", "NY_PM", "ASIA"];
const DAILY = ["ASIA", "LONDON", "NY_AM", "NY_PM"];
const WEEKLY = ["MONDAY_Q1", "TUESDAY_Q2", "WEDNESDAY_Q3", "THURSDAY_Q4", "FRIDAY_SPECIAL"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

describe("getEtDayOfWeek", () => {
  it.each([
    [10, 1],
    [11, 2],
    [12, 3],
    [13, 4],
    [14, 5],
    [15, 6],
    [16, 0],
  ])("2026-08-%i → dow %i", (day, expected) => {
    expect(getEtDayOfWeek(etTime(day, 12))).toBe(expected);
  });
});

describe("computePrepAutoFill — seans eşlemesi", () => {
  it.each([
    [0, "LONDON"],
    [5, "LONDON"],
    [6, "NY_AM"],
    [11, "NY_AM"],
    [12, "NY_PM"],
    [17, "NY_PM"],
    [18, "ASIA"],
    [23, "ASIA"],
  ])("ET %i:00 → %s", (hour, expected) => {
    const fill = computePrepAutoFill(etTime(10, hour));
    expect(fill.session).toBe(expected);
    // Session ve DailyCycle ayrı enum'lar ama aynı seanstan türer.
    expect(fill.activeCycleDaily).toBe(expected);
  });

  it("17:59 NY PM, 18:00 Asia — sınır kayması", () => {
    expect(computePrepAutoFill(etTime(10, 17, 59)).session).toBe("NY_PM");
    expect(computePrepAutoFill(etTime(10, 18, 0)).session).toBe("ASIA");
  });
});

describe("computePrepAutoFill — 90 dakikalık quarter (0 tabanlı → 1 tabanlı)", () => {
  // NY AM 06:00 ET'te başlar; her quarter 90 dakika.
  it.each([
    [6, 0, "Q1"],
    [7, 29, "Q1"],
    [7, 30, "Q2"],
    [9, 0, "Q3"],
    [10, 30, "Q4"],
    [11, 59, "Q4"],
  ])("ET %i:%i → %s", (hour, minute, expected) => {
    expect(computePrepAutoFill(etTime(10, hour, minute)).active90mCycle).toBe(expected);
  });
});

describe("computePrepAutoFill — micro (22.5 dk) blokları", () => {
  it.each([
    [6, 0, "Q1"],
    [6, 22, "Q1"],
    [6, 23, "Q2"],
    [6, 45, "Q3"],
    [7, 8, "Q4"],
  ])("ET %i:%i → %s", (hour, minute, expected) => {
    expect(computePrepAutoFill(etTime(10, hour, minute)).activeMicroCycle).toBe(expected);
  });
});

describe("computePrepAutoFill — haftalık cycle", () => {
  it.each([
    [10, "MONDAY_Q1"],
    [11, "TUESDAY_Q2"],
    [12, "WEDNESDAY_Q3"],
    [13, "THURSDAY_Q4"],
    [14, "FRIDAY_SPECIAL"],
  ])("2026-08-%i → %s", (day, expected) => {
    expect(computePrepAutoFill(etTime(day, 10)).activeCycleWeekly).toBe(expected);
  });

  it("Perşembe ile Cuma'yı ayırır (saatin weekQ değeri ikisine de 4 der)", () => {
    expect(computePrepAutoFill(etTime(13, 10)).activeCycleWeekly).toBe("THURSDAY_Q4");
    expect(computePrepAutoFill(etTime(14, 10)).activeCycleWeekly).toBe("FRIDAY_SPECIAL");
  });
});

describe("computePrepAutoFill — market kapalıyken hiçbir şey doldurulmaz", () => {
  it.each([
    ["Cuma 18:00 sonrası", etTime(14, 19)],
    ["Cumartesi", etTime(15, 12)],
    ["Pazar 18:00 öncesi", etTime(16, 10)],
  ])("%s", (_label, when) => {
    const fill = computePrepAutoFill(when);
    expect(fill.marketClosed).toBe(true);
    expect(fill.note).toBeTruthy();
    expect(fill.session).toBeNull();
    expect(fill.activeCycleWeekly).toBeNull();
    expect(fill.activeCycleDaily).toBeNull();
    expect(fill.active90mCycle).toBeNull();
    expect(fill.activeMicroCycle).toBeNull();
  });

  it("Pazar 18:00'de market tekrar açılır ve doldurma çalışır", () => {
    const fill = computePrepAutoFill(etTime(16, 18));
    expect(fill.marketClosed).toBe(false);
    expect(fill.session).toBe("ASIA");
  });
});

describe("computePrepAutoFill — dönen değerler enum üyesi", () => {
  // Şema değişip enum'lar kayarsa bu test yakalar.
  const samples = [etTime(10, 7), etTime(11, 13), etTime(12, 19), etTime(13, 2), etTime(14, 10)];

  it.each(samples.map((d, i) => [i, d]))("örnek %i", (_i, when) => {
    const fill = computePrepAutoFill(when);
    expect(SESSIONS).toContain(fill.session);
    expect(DAILY).toContain(fill.activeCycleDaily);
    expect(WEEKLY).toContain(fill.activeCycleWeekly);
    expect(QUARTERS).toContain(fill.active90mCycle);
    expect(QUARTERS).toContain(fill.activeMicroCycle);
  });
});

describe("describeAutoFill", () => {
  it("okunur bir özet üretir", () => {
    const fill = computePrepAutoFill(etTime(13, 10, 45));
    // 10:45 ET = NY AM'in 285. dakikası → 90dk Q4 (270-360), o bloğun ilk 15
    // dakikası olduğu için micro Q1.
    expect(describeAutoFill(fill)).toBe("NY AM · THURSDAY Q4 · 90dk Q4 · Micro Q1");
  });

  it("market kapalıyken boş string döner", () => {
    expect(describeAutoFill(computePrepAutoFill(etTime(15, 12)))).toBe("");
  });
});
