"use client";

import { useState, useEffect } from "react";
import { useMarketClock, type QIndex } from "./use-market-clock";

function shiftTime(etH: number, etM: number, offsetHours: number): string {
  const total = (etH * 60 + etM + offsetHours * 60 + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const Q_COLORS: Record<QIndex, { border: string; bg: string; label: string }> = {
  0: { border: "#6366f1", bg: "rgba(99,102,241,0.12)",  label: "#6366f1" },  // Acc — purple
  1: { border: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "#f59e0b" },  // Manip — amber
  2: { border: "#34c97e", bg: "rgba(52,201,126,0.12)",  label: "#34c97e" },  // Distr — green
  3: { border: "#5a5a6a", bg: "rgba(90,90,106,0.08)",   label: "#5a5a6a" },  // X — dim
};

const CYCLE_Q_COLORS: string[] = ["#6366f1", "#f59e0b", "#34c97e", "#5a5a6a"];

export function MarketClockPanel() {
  const {
    displayTime, displayTz, etTime, trTime,
    etDateLabel, session, activeQIndex,
    q90Progress, microProgress, microEndLabel, microRemainingMin,
    cycles, toggleTz, tzOffsetHours,
    sessionRemainingLabel, nextSessionName,
  } = useMarketClock();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
    >
      {/* Header row — big clock */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--color-text-muted)" }}>
            Aktif Session: <span style={{ color: "var(--color-accent)" }}>{session.name}</span>
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {String(session.startEtH).padStart(2, "0")}:00 – {String(session.endEtH === 24 ? 0 : session.endEtH).padStart(2, "0")}:00 ET · 4 × 90dk
          </p>
          <p className="text-xs mt-0.5" suppressHydrationWarning style={{ color: "var(--color-text-secondary)" }}>
            {mounted ? <>Bitişe {sessionRemainingLabel} · Sıradaki: <span style={{ color: "var(--color-accent)" }}>{nextSessionName}</span></> : ""}
          </p>
        </div>
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="text-2xl font-mono font-bold leading-none" style={{ color: "var(--color-text-primary)", letterSpacing: "0.06em" }} suppressHydrationWarning>
              {mounted ? displayTime : ""}
            </p>
            <p className="text-xs mt-0.5 text-right" style={{ color: "var(--color-text-muted)" }} suppressHydrationWarning>
              {mounted
                ? (displayTz === "ET" ? `${etDateLabel} · New York` : `${etDateLabel} · Istanbul (${etTime} ET)`)
                : ""}
            </p>
          </div>
          {/* TZ toggle */}
          <button
            onClick={toggleTz}
            title={`ET: ${etTime}  ·  TR: ${trTime}`}
            className="flex flex-col items-center px-1.5 py-1 rounded border text-xs font-bold leading-none gap-0.5 transition-colors"
            style={{
              background: "var(--color-bg-surface)",
              borderColor: "var(--color-bg-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <span style={{ color: displayTz === "ET" ? "var(--color-accent)" : "var(--color-text-muted)" }}>ET</span>
            <span style={{ color: displayTz === "TR" ? "var(--color-accent)" : "var(--color-text-muted)" }}>TR</span>
          </button>
        </div>
      </div>

      {/* Q1–Q4 session boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {session.quarters.map((q, idx) => {
          const isActive = idx === activeQIndex;
          const colors = Q_COLORS[idx as QIndex];
          const progress = isActive ? q90Progress : null;
          return (
            <div
              key={idx}
              className="rounded-lg border p-3 relative overflow-hidden transition-all"
              style={{
                background: isActive ? colors.bg : "var(--color-bg-surface)",
                borderColor: isActive ? colors.border : "var(--color-bg-border)",
                boxShadow: isActive ? `0 0 0 1px ${colors.border}` : undefined,
              }}
            >
              {/* Progress bar at bottom */}
              {progress !== null && (
                <div className="absolute bottom-0 left-0 h-0.5 transition-all" style={{ width: `${progress * 100}%`, background: colors.border }} />
              )}
              <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Q{idx + 1}</p>
              <p className="text-sm font-bold" style={{ color: isActive ? colors.label : "var(--color-text-secondary)" }}>
                {q.label}
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-muted)" }}>
                {shiftTime(q.startEtH, q.startEtM, tzOffsetHours)}–{shiftTime(q.endEtH === 24 ? 0 : q.endEtH, q.endEtM, tzOffsetHours)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Q phase legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {(["Acc", "Manip", "Distr", "X"] as const).map((label, idx) => (
          <span key={label} className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: Q_COLORS[idx as QIndex].border }} />
            {label === "Acc" ? "Accumulation" : label === "Manip" ? "Manipulation" : label === "Distr" ? "Distribution" : "X (Reversal - Continuation)"}
          </span>
        ))}
      </div>

      {/* Cycle hierarchy row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {cycles.map((c) => {
          const qIdx = (c.q - 1) as QIndex;
          const color = CYCLE_Q_COLORS[qIdx] ?? "var(--color-text-muted)";
          return (
            <div key={c.key} className="rounded-lg border p-2.5" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>{c.key}</p>
              <div
                className="inline-flex items-center justify-center rounded text-xs font-bold px-1.5 py-0.5 mb-1"
                style={{ background: `${color}22`, color }}
              >
                Q{c.q}
              </div>
              <p className="text-xs leading-tight flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
                {c.label}
                {c.key === "HAFTA" && c.label === "Salı" && (
                  <span className="text-[9px] font-bold px-1 rounded" style={{ background: "rgba(79,142,247,0.18)", color: "var(--color-accent)" }}>TWO</span>
                )}
              </p>
              {c.sub && <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>{c.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Micro progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>Micro Q{(cycles.find((c) => c.key === "MİCRO")?.q ?? 1)} · 22.5 dk blok</span>
          <span>{microRemainingMin} dk · bitiş {microEndLabel}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${microProgress * 100}%`,
              background: Q_COLORS[(cycles.find((c) => c.key === "MİCRO")?.q ?? 1) - 1 as QIndex]?.border ?? "var(--color-accent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
