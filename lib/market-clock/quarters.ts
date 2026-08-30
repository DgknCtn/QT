/**
 * Seans ve çeyrek çekirdeği — Quarterly Theory zaman ızgarasının tek kaynağı.
 *
 * Bu dosya bilerek React'ten ve `"use client"`'tan bağımsız tutuldu:
 * `components/market-clock/use-market-clock.ts` bir client modülü, yani
 * Next.js onun tüm export'larını client-reference'a çeviriyor ve oradaki
 * `computeState` bir server action içinden çağrılamıyor. Broker CSV import'u
 * her pozisyonun açılış anını çeyreğe map etmek zorunda ve bunu sunucuda
 * yapıyor — o yüzden hesabın kendisi burada yaşıyor, saat bileşeni de
 * buradan tüketiyor.
 *
 * Hesap her zaman ET ile yapılır: seans sınırları ve Q1..Q4 ET tanımlıdır,
 * kullanıcının TR/ET görüntü tercihinden bağımsızdır.
 */

export type QLabel = "Acc" | "Manip" | "Distr" | "X";
export type QIndex = 0 | 1 | 2 | 3; // 0=Q1 … 3=Q4

export interface SessionInfo {
  name: string;       // "London" | "NY AM" | "NY PM" | "Asia"
  dayQ: QIndex;       // which day-level Q this session is
  startEtH: number;   // session start hour ET
  endEtH: number;     // session end hour ET (exclusive; Asia wraps 18→24 then 0→0)
  quarters: { label: QLabel; startEtH: number; startEtM: number; endEtH: number; endEtM: number }[];
}

export const Q_LABELS: QLabel[] = ["Acc", "Manip", "Distr", "X"];

export const SESSIONS: SessionInfo[] = [
  {
    name: "Asia", dayQ: 0, startEtH: 18, endEtH: 24,
    quarters: [
      { label: "Acc",   startEtH: 18, startEtM: 0, endEtH: 19, endEtM: 30 },
      { label: "Manip", startEtH: 19, startEtM: 30, endEtH: 21, endEtM: 0 },
      { label: "Distr", startEtH: 21, startEtM: 0, endEtH: 22, endEtM: 30 },
      { label: "X",     startEtH: 22, startEtM: 30, endEtH: 24, endEtM: 0 },
    ],
  },
  {
    name: "London", dayQ: 1, startEtH: 0, endEtH: 6,
    quarters: [
      { label: "Acc",   startEtH: 0,  startEtM: 0,  endEtH: 1,  endEtM: 30 },
      { label: "Manip", startEtH: 1,  startEtM: 30, endEtH: 3,  endEtM: 0 },
      { label: "Distr", startEtH: 3,  startEtM: 0,  endEtH: 4,  endEtM: 30 },
      { label: "X",     startEtH: 4,  startEtM: 30, endEtH: 6,  endEtM: 0 },
    ],
  },
  {
    name: "NY AM", dayQ: 2, startEtH: 6, endEtH: 12,
    quarters: [
      { label: "Acc",   startEtH: 6,  startEtM: 0,  endEtH: 7,  endEtM: 30 },
      { label: "Manip", startEtH: 7,  startEtM: 30, endEtH: 9,  endEtM: 0 },
      { label: "Distr", startEtH: 9,  startEtM: 0,  endEtH: 10, endEtM: 30 },
      { label: "X",     startEtH: 10, startEtM: 30, endEtH: 12, endEtM: 0 },
    ],
  },
  {
    name: "NY PM", dayQ: 3, startEtH: 12, endEtH: 18,
    quarters: [
      { label: "Acc",   startEtH: 12, startEtM: 0,  endEtH: 13, endEtM: 30 },
      { label: "Manip", startEtH: 13, startEtM: 30, endEtH: 15, endEtM: 0 },
      { label: "Distr", startEtH: 15, startEtM: 0,  endEtH: 16, endEtM: 30 },
      { label: "X",     startEtH: 16, startEtM: 30, endEtH: 18, endEtM: 0 },
    ],
  },
];

/** Bir anın ET takvim/saat parçaları. */
export function getEtParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), min: get("minute"), s: get("second") };
}

export interface QuarterPosition {
  session: SessionInfo;
  /** Seans içindeki 90 dakikalık blok (0–3). */
  activeQIndex: QIndex;
  /** 90 dakikalık blok içindeki 22.5 dakikalık blok (0–3). */
  microIndex: QIndex;
  /** Seans başlangıcından bu yana geçen dakika (Asya gece yarısını sarar). */
  minutesSinceStart: number;
  minutesInQ90: number;
  minutesInMicro: number;
  sessionStartMin: number;
}

/**
 * Bir anı seans + 90dk çeyrek + micro çeyreğe oturtur.
 *
 * Hafta sonu kavramı burada yok — bilerek. Vadeli piyasa hafta sonu kapalı
 * ama kripto 7/24 işlem görüyor, ve hafta sonu açılan bir pozisyonun da
 * çeyreği vardır. Market açık/kapalı kararı çağıranın işi.
 */
export function resolveQuarter(now: Date): QuarterPosition {
  const et = getEtParts(now);
  const etTotalMinutes = et.h * 60 + et.min;

  const session = SESSIONS.find((s) => {
    if (s.name === "Asia") return et.h >= 18; // 18–23
    return et.h >= s.startEtH && et.h < s.endEtH;
  }) ?? SESSIONS[0]; // fallback Asia (midnight edge)

  const sessionStartMin = session.name === "Asia" ? 18 * 60 : session.startEtH * 60;
  const minutesSinceStart = etTotalMinutes >= sessionStartMin
    ? etTotalMinutes - sessionStartMin
    : etTotalMinutes + (24 * 60 - sessionStartMin); // Asia wrap past midnight

  const activeQIndex = Math.min(Math.floor(minutesSinceStart / 90), 3) as QIndex;
  const minutesInQ90 = minutesSinceStart % 90;
  const microIndex = Math.min(Math.floor(minutesInQ90 / 22.5), 3) as QIndex;
  const minutesInMicro = minutesInQ90 % 22.5;

  return { session, activeQIndex, microIndex, minutesSinceStart, minutesInQ90, minutesInMicro, sessionStartMin };
}
