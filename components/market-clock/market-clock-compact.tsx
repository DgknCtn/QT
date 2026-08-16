"use client";

import { useMarketClock } from "./use-market-clock";

export function MarketClockCompact() {
  const { displayTime, displayTz, etTime, trTime, session, activeQIndex, cycles, toggleTz, marketClosed, ready } = useMarketClock();

  const q90 = cycles.find((c) => c.key === "90 DK");

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Clock — suppress hydration since time changes every second */}
      <div className="text-right">
        <p
          className="text-sm font-mono font-bold leading-none"
          style={{ color: "var(--color-text-primary)", letterSpacing: "0.04em" }}
          suppressHydrationWarning
        >
          {ready ? displayTime : ""}
        </p>
        <p className="text-xs leading-none mt-0.5" style={{ color: "var(--color-text-muted)" }} suppressHydrationWarning>
          {ready
            ? (marketClosed ? "Market kapalı" : `${session.name} · Q${activeQIndex + 1} ${q90?.label}`)
            : ""}
        </p>
      </div>

      {/* TZ toggle */}
      <button
        onClick={toggleTz}
        aria-label={`Saat dilimini ${displayTz === "ET" ? "TR" : "ET"} olarak değiştir`}
        title={ready ? `Switch to ${displayTz === "ET" ? "TR" : "ET"} time\nET: ${etTime} · TR: ${trTime}` : undefined}
        suppressHydrationWarning
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
  );
}
