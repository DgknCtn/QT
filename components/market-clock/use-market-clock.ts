"use client";

import { useState, useEffect } from "react";
import { useClockTz, type DisplayTz } from "./clock-tz-context";
import {
  SESSIONS,
  Q_LABELS,
  getEtParts,
  resolveQuarter,
  type QLabel,
  type QIndex,
  type SessionInfo,
} from "@/lib/market-clock/quarters";

// ─── Types ────────────────────────────────────────────────────────────────────

// Seans tablosu ve çeyrek matematiği `lib/market-clock/quarters.ts` içinde
// yaşıyor: bu dosya bir client modülü, ama aynı hesabı broker CSV import'u
// sunucu tarafında da yapmak zorunda. Tipler geriye dönük uyum için
// buradan da dışa veriliyor.
export type { DisplayTz, QLabel, QIndex, SessionInfo };

export interface CycleEntry {
  key: string;   // "YIL" | "AY" | "HAFTA" | "GÜN" | "90 DK" | "MİCRO"
  q: number;     // 1–4
  label: string; // e.g. "Nis-Haz", "Perşembe", "Londra"
  sub?: string;  // extra info line
}

export interface MarketClockState {
  // Displayed clock strings
  displayTime: string;    // formatted in selected tz
  displayTz: DisplayTz;
  etTime: string;         // always ET, used as secondary when TR selected
  trTime: string;         // always TR

  // Date info
  etDateLabel: string;    // "Thu 11 Jun 2026" (ET)
  trDateLabel: string;    // "Fri 12 Jun 2026" (TR)

  // Session
  session: SessionInfo;
  activeQIndex: QIndex;   // 0–3 which 90min block within session
  microIndex: QIndex;     // 0–3 which 22.5min block within 90min

  // Progress within current 90min (0–1)
  q90Progress: number;
  microProgress: number;
  microEndLabel: string;  // e.g. "03:45" (ET or TR depending on displayTz)
  microRemainingMin: number;

  // Hierarchy cycles
  cycles: CycleEntry[];

  // Session countdown + next session
  sessionRemainingLabel: string;
  nextSessionName: string;

  // Market open/closed (weekend)
  marketClosed: boolean;
  marketStatusLabel: string;

  // TR offset from ET in hours (7 in summer EDT, 8 in winter EST)
  tzOffsetHours: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTrParts(now: Date) {
  const parts = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("hour")}:${get("minute")}:${get("second")}`;
}

function getTrOffsetHours(now: Date): number {
  const etH = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(now),
    10
  );
  const trH = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", hour: "2-digit", hourCycle: "h23" }).format(now),
    10
  );
  return (trH - etH + 24) % 24; // +7 in summer (EDT), +8 in winter (EST)
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

function getWeekOfMonth(date: Date): number {
  // Count how many Mondays have occurred in the month up to this date (ET)
  const parts = getEtParts(date);
  const firstDay = new Date(parts.y, parts.mo - 1, 1).getDay(); // 0=Sun
  const mondayOffset = firstDay === 0 ? 1 : (8 - firstDay) % 7; // days until first Monday
  const dayOfMonth = parts.d;
  if (dayOfMonth < mondayOffset) return 0; // before first full week
  return Math.ceil((dayOfMonth - mondayOffset + 1) / 7);
}

/** Exported for tests: pure function of (instant, display timezone). */
export function computeState(now: Date, displayTz: DisplayTz): MarketClockState {
  const et = getEtParts(now);
  const etTotalMinutes = et.h * 60 + et.min;

  // ── Session detection ── (paylaşılan çekirdek)
  const {
    session, activeQIndex, microIndex,
    minutesSinceStart, minutesInQ90, minutesInMicro, sessionStartMin,
  } = resolveQuarter(now);

  // Micro end time (ET)
  const microEndMin = sessionStartMin + activeQIndex * 90 + (microIndex + 1) * 22.5;
  const microEndH = Math.floor(microEndMin / 60) % 24;
  const microEndM = Math.floor(microEndMin % 60);

  // ── Clock strings ──
  const etStr = `${pad2(et.h)}:${pad2(et.min)}:${pad2(et.s)}`;
  const trStr = getTrParts(now);

  // ── Date label (ET) ──
  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const etDateObj = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const etDateLabel = `${DAYS_SHORT[etDateObj.getDay()]} ${pad2(et.d)} ${MONTHS_SHORT[et.mo - 1]} ${et.y}`;

  // ── Date label (TR) — TR görünümünde gün/tarih İstanbul'a göre gösterilsin ──
  const trDateObj = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const trDateLabel = `${DAYS_SHORT[trDateObj.getDay()]} ${pad2(trDateObj.getDate())} ${MONTHS_SHORT[trDateObj.getMonth()]} ${trDateObj.getFullYear()}`;

  // ── Micro end label in displayTz ──
  let microEndLabel: string;
  if (displayTz === "ET") {
    microEndLabel = `${pad2(microEndH)}:${pad2(microEndM)} ET`;
  } else {
    // TR = ET + offset (handle DST: in summer EDT = UTC-4, TR = UTC+3 → +7h)
    const microEndDate = new Date(now);
    const diffMs = (22.5 - minutesInMicro) * 60 * 1000;
    microEndDate.setTime(microEndDate.getTime() + diffMs);
    const trEnd = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(microEndDate);
    microEndLabel = `${trEnd} TR`;
  }

  const microRemainingMin = Math.ceil(22.5 - minutesInMicro);

  // ── Cycle hierarchy ──
  const month = et.mo; // 1–12
  const yearQ = Math.ceil(month / 3);
  const YEAR_Q_LABELS = ["", "Oca-Mar", "Nis-Haz", "Tem-Eyl", "Eki-Ara"];

  const weekOfMonth = getWeekOfMonth(now);
  const monthQ = Math.min(Math.max(weekOfMonth, 1), 4);
  const MONTH_Q_LABELS = ["", "1. hafta", "2. hafta", "3. hafta", "4. hafta"];

  const DOW_NAMES = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const dow = etDateObj.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const weekQ = dow === 5 ? 4 : dow === 6 || dow === 0 ? 0 : dow;
  const weekLabel = DOW_NAMES[dow] ?? "?";

  // ── Market açık/kapalı (hafta sonu): Cuma 18:00 ET → Pazar 18:00 ET ──
  const marketClosed =
    dow === 6 ||                                 // Cumartesi (tüm gün)
    (dow === 5 && etTotalMinutes >= 18 * 60) ||  // Cuma 18:00 sonrası
    (dow === 0 && etTotalMinutes < 18 * 60);     // Pazar 18:00 öncesi

  // Açılışa kalan süre — Pazar 18:00 ET
  let marketStatusLabel = "Hafta sonu · Market kapalı";
  let marketReopenLabel = "";
  if (marketClosed) {
    const reopenMin = dow === 0
      ? 18 * 60 - etTotalMinutes
      : (7 - dow) * 24 * 60 + 18 * 60 - etTotalMinutes; // Cuma/Cumartesi
    if (reopenMin >= 24 * 60) {
      const d = Math.floor(reopenMin / (24 * 60));
      const h = Math.floor((reopenMin % (24 * 60)) / 60);
      marketReopenLabel = h > 0 ? `${d}g ${h}sa` : `${d}g`;
    } else {
      const h = Math.floor(reopenMin / 60);
      const m = reopenMin % 60;
      marketReopenLabel = h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
    }
    marketStatusLabel = `Market kapalı · Açılışa ${marketReopenLabel} (Paz 18:00 ET)`;
  }

  // ── Remaining time calculations ──

  // 90 DK remaining
  const q90RemainingMin = Math.ceil(90 - minutesInQ90);
  const q90Sub = q90RemainingMin >= 60
    ? `${Math.floor(q90RemainingMin / 60)}sa ${q90RemainingMin % 60}dk kaldı`
    : `${q90RemainingMin} dk kaldı`;

  // GÜN (session) remaining — each session = 360 min
  const sessionRemainingMin = Math.ceil(360 - minutesSinceStart);
  const günSub = sessionRemainingMin <= 0 ? "Seans bitti" :
    sessionRemainingMin >= 60
      ? `${Math.floor(sessionRemainingMin / 60)}sa ${sessionRemainingMin % 60}dk kaldı`
      : `${sessionRemainingMin} dk kaldı`;

  // HAFTA remaining — until Friday 18:00 ET
  let haftaSub: string;
  if (dow === 6 || dow === 0) {
    haftaSub = "Hafta sonu";
  } else {
    // Minutes since Monday 00:00 ET
    const minFromMon = (dow - 1) * 24 * 60 + et.h * 60 + et.min;
    const fridayCloseFromMon = 4 * 24 * 60 + 18 * 60; // Mon=0, Fri=4 days later at 18:00
    const weekRemainingMin = Math.ceil(fridayCloseFromMon - minFromMon);
    if (weekRemainingMin <= 0) {
      haftaSub = "Hafta kapandı";
    } else if (weekRemainingMin >= 24 * 60) {
      const d = Math.floor(weekRemainingMin / (24 * 60));
      const h = Math.floor((weekRemainingMin % (24 * 60)) / 60);
      haftaSub = h > 0 ? `${d}g ${h}sa kaldı` : `${d} gün kaldı`;
    } else {
      const h = Math.floor(weekRemainingMin / 60);
      const m = weekRemainingMin % 60;
      haftaSub = h > 0 ? `${h}sa ${m}dk kaldı` : `${m} dk kaldı`;
    }
  }

  // AY remaining — days until end of month
  const lastDayOfMonth = new Date(et.y, et.mo, 0).getDate();
  const daysLeftMonth = lastDayOfMonth - et.d;
  const aySub = daysLeftMonth > 0 ? `${daysLeftMonth} gün kaldı` : "Ayın son günü";

  // YIL (quarter) remaining — days until end of current quarter
  const quarterEndMonth = yearQ * 3; // 3=Mar, 6=Jun, 9=Sep, 12=Dec
  const quarterEndDate = new Date(et.y, quarterEndMonth, 0); // last day of quarter month
  const etToday = new Date(et.y, et.mo - 1, et.d);
  const daysLeftQuarter = Math.ceil((quarterEndDate.getTime() - etToday.getTime()) / 86_400_000);
  const yilSub = daysLeftQuarter > 0 ? `${daysLeftQuarter} gün kaldı` : "Çeyrek bitiyor";

  const cycles: CycleEntry[] = [
    { key: "YIL",    q: yearQ,          label: YEAR_Q_LABELS[yearQ] ?? "",      sub: yilSub },
    { key: "AY",     q: monthQ,         label: MONTH_Q_LABELS[monthQ] ?? "",    sub: aySub },
    { key: "HAFTA",  q: weekQ || 1,     label: weekLabel,                       sub: haftaSub },
    { key: "GÜN",    q: session.dayQ + 1, label: session.name,                  sub: günSub },
    { key: "90 DK",  q: activeQIndex + 1, label: Q_LABELS[activeQIndex],        sub: q90Sub },
    { key: "MİCRO",  q: microIndex + 1,   label: `${microIndex + 1}/4 · ${microEndLabel}`, sub: `${microRemainingMin} dk kaldı` },
  ];

  const displayTime = displayTz === "ET" ? etStr : trStr;
  const tzOffsetHours = displayTz === "TR" ? getTrOffsetHours(now) : 0;

  // Session countdown label + next session (chronological order by dayQ)
  const sessionRemainingLabel = sessionRemainingMin <= 0
    ? "bitiyor"
    : sessionRemainingMin >= 60
      ? `${Math.floor(sessionRemainingMin / 60)}sa ${sessionRemainingMin % 60}dk`
      : `${sessionRemainingMin}dk`;
  const nextSessionName = SESSIONS.find((s) => s.dayQ === ((session.dayQ + 1) % 4))?.name ?? "";

  return {
    displayTime,
    displayTz,
    etTime: etStr,
    trTime: trStr,
    etDateLabel,
    trDateLabel,
    session,
    activeQIndex,
    microIndex,
    q90Progress: minutesInQ90 / 90,
    microProgress: minutesInMicro / 22.5,
    microEndLabel,
    microRemainingMin,
    cycles,
    sessionRemainingLabel,
    nextSessionName,
    tzOffsetHours,
    marketClosed,
    marketStatusLabel,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Stand-in date used for the server render and the first client render. */
const PREHYDRATION_DATE = new Date(0);

export function useMarketClock(): MarketClockState & { toggleTz: () => void; ready: boolean } {
  const { displayTz, toggleTz } = useClockTz();
  const [now, setNow] = useState<Date | null>(null);

  // Tick every second. The clock only starts after mount: the server render and
  // the first client render must produce identical markup, and a live timestamp
  // never can -- rendering `new Date()` during SSR is what caused a hydration
  // mismatch on every page that shows the clock.
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Derived on each render, so switching timezone updates without waiting a tick.
  const state = computeState(now ?? PREHYDRATION_DATE, displayTz);

  // Consumers must withhold every time-dependent value (text *and* attributes
  // such as `title`) until this is true.
  return { ...state, ready: now !== null, toggleTz };
}
