import { computeState } from "@/components/market-clock/use-market-clock";
import type { Session, WeeklyCycle, DailyCycle, QuarterCycle } from "@prisma/client";

/**
 * Daily Prep Adım 1 ve Adım 4'ü market saatinden doldurur.
 *
 * Saatin çıktısı ile Prisma enum'ları BİREBİR AYNI DEĞİL — bu dosyanın tek işi
 * o çeviriyi tek yerde ve test edilebilir şekilde tutmak:
 *   - `session.name` insan okunur ("NY AM"), enum ise `NY_AM`
 *   - `activeQIndex` / `microIndex` 0 tabanlı, `QuarterCycle` 1 tabanlı
 *   - haftalık cycle saatte hiç yok; ET hafta gününden türetilir
 *
 * Hesap her zaman ET ile yapılır: enum'lar (NY AM, Q1…) ET tanımlı, kullanıcının
 * TR/ET görüntü tercihinden bağımsızdır.
 */

/** Saatin seans adı → Prisma enum. `satisfies` sayesinde enum değişirse build kırılır. */
const SESSION_BY_NAME = {
  London: "LONDON",
  "NY AM": "NY_AM",
  "NY PM": "NY_PM",
  Asia: "ASIA",
} as const satisfies Record<string, Session>;

const DAILY_CYCLE_BY_NAME = {
  London: "LONDON",
  "NY AM": "NY_AM",
  "NY PM": "NY_PM",
  Asia: "ASIA",
} as const satisfies Record<string, DailyCycle>;

/** ET hafta günü (0=Pazar) → haftalık cycle. Hafta sonunun karşılığı yok. */
const WEEKLY_CYCLE_BY_DOW: Record<number, WeeklyCycle | null> = {
  0: null,
  1: "MONDAY_Q1",
  2: "TUESDAY_Q2",
  3: "WEDNESDAY_Q3",
  4: "THURSDAY_Q4",
  5: "FRIDAY_SPECIAL",
  6: null,
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const satisfies readonly QuarterCycle[];

export type PrepAutoFill = {
  session: Session | null;
  activeCycleWeekly: WeeklyCycle | null;
  activeCycleDaily: DailyCycle | null;
  active90mCycle: QuarterCycle | null;
  activeMicroCycle: QuarterCycle | null;
  /** Hafta sonu penceresi (Cuma 18:00 ET → Pazar 18:00 ET). */
  marketClosed: boolean;
  /** Doldurma yapılmadıysa nedenini anlatan Türkçe not. */
  note: string | null;
};

/** Boş sonuç — market kapalıyken hiçbir alan doldurulmaz. */
const NOTHING: Omit<PrepAutoFill, "marketClosed" | "note"> = {
  session: null,
  activeCycleWeekly: null,
  activeCycleDaily: null,
  active90mCycle: null,
  activeMicroCycle: null,
};

/**
 * ET hafta günü (0=Pazar … 6=Cumartesi).
 *
 * Saatin kendi `weekQ` değeri kullanılamaz: orada Cuma da Perşembe de 4'e
 * eşleniyor, yani FRIDAY_SPECIAL ile THURSDAY_Q4 ayırt edilemiyor.
 */
export function getEtDayOfWeek(now: Date): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short);
}

/** `index` 0 tabanlı gelir, QuarterCycle 1 tabanlıdır. */
function quarterFromIndex(index: number): QuarterCycle | null {
  return QUARTERS[index] ?? null;
}

export function computePrepAutoFill(now: Date): PrepAutoFill {
  const state = computeState(now, "ET");

  if (state.marketClosed) {
    return {
      ...NOTHING,
      marketClosed: true,
      note: "Market kapalı — otomatik doldurma yapılmadı. Alanları elle seç.",
    };
  }

  const dow = getEtDayOfWeek(now);
  const name = state.session.name as keyof typeof SESSION_BY_NAME;

  return {
    session: SESSION_BY_NAME[name] ?? null,
    activeCycleWeekly: WEEKLY_CYCLE_BY_DOW[dow] ?? null,
    activeCycleDaily: DAILY_CYCLE_BY_NAME[name] ?? null,
    active90mCycle: quarterFromIndex(state.activeQIndex),
    activeMicroCycle: quarterFromIndex(state.microIndex),
    marketClosed: false,
    note: null,
  };
}

/** Şeritte gösterilen özet: "NY AM · Perşembe Q4 · 90dk Q2 · Micro Q3". */
export function describeAutoFill(fill: PrepAutoFill): string {
  const parts = [
    fill.activeCycleDaily?.replace(/_/g, " "),
    fill.activeCycleWeekly?.replace(/_/g, " "),
    fill.active90mCycle && `90dk ${fill.active90mCycle}`,
    fill.activeMicroCycle && `Micro ${fill.activeMicroCycle}`,
  ].filter(Boolean);
  return parts.join(" · ");
}
