"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface HeatmapTrade {
  id: string;
  instrument: string;
  direction: string | null;
  result: string | null;
  pnlCurrency: number | null;
  rResult: number | null;
  session: string | null;
}

interface DayData {
  date: string; // "YYYY-MM-DD"
  pnl: number;
  count: number;
  trades: HeatmapTrade[];
}

interface Props {
  days: DayData[];
  year: number;
  month: number;
}

function fmt$(n: number) {
  return `${n >= 0 ? "+" : ""}$${Math.abs(n).toFixed(0)}`;
}

export function PnlHeatmap({ days, year, month }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<DayData | null>(null);

  const dayMap = new Map(days.map((d) => [d.date, d]));

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);
  const startDow = firstDay.getDay();
  const offset   = (startDow + 6) % 7;

  const cells: (DayData | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      const mo = String(month).padStart(2, "0");
      const key = `${year}-${mo}-${d}`;
      return dayMap.get(key) ?? { date: key, pnl: 0, count: 0, trades: [] };
    }),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  function cellColor(d: DayData | null): string {
    if (!d || d.count === 0) return "var(--color-bg-surface)";
    if (d.pnl > 100)  return "#166534";
    if (d.pnl > 0)    return "#15803d";
    if (d.pnl > -50)  return "#7f1d1d";
    return "#991b1b";
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const DOW = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const totalPnl = days.reduce((s, d) => s + d.pnl, 0);
  const winDays  = days.filter((d) => d.pnl > 0).length;
  const lossDays = days.filter((d) => d.pnl < 0).length;

  const RESULT_COLORS: Record<string, string> = {
    WIN: "#34c97e", LOSS: "#ef4444", BE: "#f59e0b", PARTIAL: "#6366f1",
  };

  return (
    <>
      <div className="space-y-3">
        {/* Summary row */}
        <div className="flex gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>Toplam P&L: <strong style={{ color: totalPnl >= 0 ? "#34c97e" : "#ef4444" }}>{fmt$(totalPnl)}</strong></span>
          <span style={{ color: "#34c97e" }}>{winDays} kazançlı gün</span>
          <span style={{ color: "#ef4444" }}>{lossDays} kayıplı gün</span>
        </div>

        {/* DOW headers */}
        <div className="grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <div key={d} className="text-center text-xs py-0.5" style={{ color: "var(--color-text-muted)" }}>{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day && day.count > 0 ? `${day.date}: ${fmt$(day.pnl)} (${day.count} trade)` : day?.date ?? ""}
                  className="rounded aspect-square flex flex-col items-center justify-center transition-opacity hover:opacity-80"
                  style={{
                    background: cellColor(day),
                    border: "1px solid var(--color-bg-border)",
                    minHeight: 36,
                    cursor: day && day.count > 0 ? "pointer" : "default",
                  }}
                  onClick={() => day && day.count > 0 && setSelected(day)}
                >
                  {day && (
                    <>
                      <span className="text-xs font-medium" style={{ color: day.count > 0 ? "#fff" : "var(--color-text-muted)", fontSize: 10 }}>
                        {new Date(day.date + "T12:00:00").getDate()}
                      </span>
                      {day.count > 0 && (
                        <span style={{ color: "#fff", fontSize: 9, opacity: 0.85 }}>{fmt$(day.pnl)}</span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>

      {/* Day popup */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="rounded-xl border w-full max-w-sm mx-4 overflow-hidden"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-bg-border)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {new Date(selected.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-xs mt-0.5" style={{ color: selected.pnl >= 0 ? "#34c97e" : "#ef4444" }}>
                  {fmt$(selected.pnl)} · {selected.count} trade
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--color-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Trade list */}
            <div className="divide-y" style={{ borderColor: "var(--color-bg-border)" }}>
              {selected.trades.map((t) => (
                <button
                  key={t.id}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:opacity-80"
                  style={{ background: "transparent" }}
                  onClick={() => router.push(`/journal/${t.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{t.instrument}</span>
                    {t.direction && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{
                          background: t.direction === "LONG" ? "rgba(52,201,126,0.15)" : "rgba(239,68,68,0.15)",
                          color: t.direction === "LONG" ? "#34c97e" : "#ef4444",
                        }}>
                        {t.direction}
                      </span>
                    )}
                    {t.result && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{
                          background: `${RESULT_COLORS[t.result] ?? "#6b7280"}22`,
                          color: RESULT_COLORS[t.result] ?? "#6b7280",
                        }}>
                        {t.result}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {t.pnlCurrency != null && (
                      <p className="text-xs font-semibold" style={{ color: t.pnlCurrency >= 0 ? "#34c97e" : "#ef4444" }}>
                        {fmt$(t.pnlCurrency)}
                      </p>
                    )}
                    {t.rResult != null && (
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {t.rResult >= 0 ? "+" : ""}{t.rResult.toFixed(1)}R
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
