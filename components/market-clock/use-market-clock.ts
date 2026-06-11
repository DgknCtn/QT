"use client";

import { useState, useEffect } from "react";
import { useClockTz, type DisplayTz } from "./clock-tz-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { DisplayTz };

export type QLabel = "Acc" | "Manip" | "Distr" | "X";
export type QIndex = 0 | 1 | 2 | 3; // 0=Q1 … 3=Q4

export interface SessionInfo {
  name: string;       // "London" | "NY AM" | "NY PM" | "Asia"
  dayQ: QIndex;       // which day-level Q this session is
  startEtH: number;   // session start hour ET
  endEtH: number;     // session end hour ET (exclusive; Asia wraps 18→24 then 0→0)
  quarters: { label: QLabel; startEtH: number; startEtM: number; endEtH: number; endEtM: number }[];
}

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

  // Date info (ET-based)
  etDateLabel: string;    // "Thu 11 Jun 2026"

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

  // TR offset from ET in hours (7 in summer EDT, 8 in winter EST)
  tzOffsetHours: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const Q_LABELS: QLabel[] = ["Acc", "Manip", "Distr", "X"];

const SESSIONS: SessionInfo[] = [
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEtParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), min: get("minute"), s: get("second") };
}

function getTrParts(now: Date) {
  const parts = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("hour")}:${get("minute")}:${get("second")}`;
}

function getTrOffsetHours(now: Date): number {
  const etH = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hour12: false }).format(now),
    10
  );
  const trH = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", hour: "2-digit", hour12: false }).format(now),
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

function computeState(now: Date, displayTz: DisplayTz): MarketClockState {
  const et = getEtParts(now);
  const etTotalMinutes = et.h * 60 + et.min;

  // ── Session detection ──
  const etH = et.h;
  const session = SESSIONS.find((s) => {
    if (s.name === "Asia") return etH >= 18; // 18–23
    return etH >= s.startEtH && etH < s.endEtH;
  }) ?? SESSIONS[0]; // fallback Asia (midnight edge)

  // Minutes since session start
  const sessionStartMin = session.name === "Asia" ? 18 * 60 : session.startEtH * 60;
  const minutesSinceStart = etTotalMinutes >= sessionStartMin
    ? etTotalMinutes - sessionStartMin
    : etTotalMinutes + (24 * 60 - sessionStartMin); // Asia wrap past midnight

  const activeQIndex = Math.min(Math.floor(minutesSinceStart / 90), 3) as QIndex;
  const minutesInQ90 = minutesSinceStart % 90;
  const microIndex = Math.min(Math.floor(minutesInQ90 / 22.5), 3) as QIndex;
  const minutesInMicro = minutesInQ90 % 22.5;

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
      timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", hour12: false,
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
  // getDay(): 0=Sun,1=Mon,...,6=Sat
  const dow = etDateObj.getDay();
  const weekQ = dow === 5 ? 4 : dow === 6 || dow === 0 ? 0 : dow; // Mon=1,Tue=2,Wed=3,Thu=4,Fri→4,Weekend→0
  const weekLabel = DOW_NAMES[dow] ?? "?";

  const cycles: CycleEntry[] = [
    { key: "YIL",    q: yearQ,   label: YEAR_Q_LABELS[yearQ] ?? "" },
    { key: "AY",     q: monthQ,  label: MONTH_Q_LABELS[monthQ] ?? "", sub: "ilk tam haftadan" },
    { key: "HAFTA",  q: weekQ || 1, label: weekLabel },
    { key: "GÜN",    q: session.dayQ + 1, label: session.name },
    { key: "90 DK",  q: activeQIndex + 1, label: Q_LABELS[activeQIndex] },
    { key: "MİCRO",  q: microIndex + 1,   label: `${microIndex + 1}/4 · ${microEndLabel}`, sub: `${microRemainingMin} dk kaldı` },
  ];

  const displayTime = displayTz === "ET" ? etStr : trStr;
  const tzOffsetHours = displayTz === "TR" ? getTrOffsetHours(now) : 0;

  return {
    displayTime,
    displayTz,
    etTime: etStr,
    trTime: trStr,
    etDateLabel,
    session,
    activeQIndex,
    microIndex,
    q90Progress: minutesInQ90 / 90,
    microProgress: minutesInMicro / 22.5,
    microEndLabel,
    microRemainingMin,
    cycles,
    tzOffsetHours,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMarketClock(): MarketClockState & { toggleTz: () => void } {
  const { displayTz, toggleTz } = useClockTz();
  const [state, setState] = useState<MarketClockState>(() => computeState(new Date(), displayTz));

  // Tick every second, re-run when displayTz changes
  useEffect(() => {
    const tick = () => setState(computeState(new Date(), displayTz));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [displayTz]);

  return { ...state, toggleTz };
}
