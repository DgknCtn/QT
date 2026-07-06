"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "qt-dashboard-stats-collapsed";

type StatsRowProps = {
  activeWeekCount: number;
  weekWR: number | null;
  last10WR: number | null;
  last10Count: number;
  last10Wins: number;
  last10NetR: number;
  last10NetPnl: number;
  todayPnl: number;
  hasTodayTrades: boolean;
  todayTradesCount: number;
};

export function StatsRow({
  activeWeekCount,
  weekWR,
  last10WR,
  last10Count,
  last10Wins,
  last10NetR,
  last10NetPnl,
  todayPnl,
  hasTodayTrades,
  todayTradesCount,
}: StatsRowProps) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Mount öncesi server ile aynı: açık render et (hydration guard).
  const isCollapsed = mounted && collapsed;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Stats
        </p>
        <button
          type="button"
          onClick={toggle}
          aria-label={isCollapsed ? "Show stats" : "Hide stats"}
          aria-expanded={!isCollapsed}
          className="p-1 rounded-md transition-opacity hover:opacity-80"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>This Week</p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{activeWeekCount}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {weekWR != null ? `${weekWR}% win rate` : "0 trades"}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Last 10 Win Rate</p>
            <p className="text-2xl font-bold" style={{ color: last10WR != null && last10WR >= 50 ? "#34c97e" : last10WR != null && last10WR >= 40 ? "#f59e0b" : "var(--color-text-primary)" }}>
              {last10WR != null ? `${last10WR}%` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {last10Count < 10 ? `${last10Count}/10 trade` : `${last10Wins}W / ${last10Count - last10Wins}L`}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Last 10 Net R</p>
            <p className="text-2xl font-bold" style={{ color: last10NetR > 0 ? "#34c97e" : last10NetR < 0 ? "#ef4444" : "var(--color-text-primary)" }}>
              {last10Count > 0 ? `${last10NetR >= 0 ? "+" : ""}${last10NetR.toFixed(1)}R` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {last10NetPnl !== 0 ? `${last10NetPnl >= 0 ? "+" : ""}$${Math.abs(last10NetPnl).toFixed(0)}` : "son 10 trade"}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Today&apos;s P&amp;L</p>
            <p className="text-2xl font-bold" style={{ color: hasTodayTrades ? (todayPnl > 0 ? "#34c97e" : todayPnl < 0 ? "#ef4444" : "var(--color-text-primary)") : "var(--color-text-muted)" }}>
              {hasTodayTrades ? `${todayPnl >= 0 ? "+" : ""}$${Math.abs(todayPnl).toFixed(0)}` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {hasTodayTrades ? `${todayTradesCount} trade` : "no trades today"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
