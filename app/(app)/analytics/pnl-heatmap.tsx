"use client";

interface DayData {
  date: string; // "YYYY-MM-DD"
  pnl: number;
  count: number;
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
  const dayMap = new Map(days.map((d) => [d.date, d]));

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);
  const startDow = firstDay.getDay(); // 0=Sun, shift to Mon=0
  const offset   = (startDow + 6) % 7; // Mon-start offset

  const cells: (DayData | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      const mo = String(month).padStart(2, "0");
      const key = `${year}-${mo}-${d}`;
      return dayMap.get(key) ?? { date: key, pnl: 0, count: 0 };
    }),
  ];

  // Pad to full weeks
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

  const totalPnl  = days.reduce((s, d) => s + d.pnl, 0);
  const winDays   = days.filter((d) => d.pnl > 0).length;
  const lossDays  = days.filter((d) => d.pnl < 0).length;

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span>Toplam P&L: <strong style={{ color: totalPnl >= 0 ? "#34c97e" : "#ef4444" }}>{fmt$(totalPnl)}</strong></span>
        <span style={{ color: "#34c97e" }}>{winDays} yeşil gün</span>
        <span style={{ color: "#ef4444" }}>{lossDays} kırmızı gün</span>
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
                className="rounded aspect-square flex flex-col items-center justify-center cursor-default transition-opacity hover:opacity-80"
                style={{
                  background: cellColor(day),
                  border: "1px solid var(--color-bg-border)",
                  minHeight: 36,
                }}
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

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span>Daha az</span>
        {["var(--color-bg-surface)", "#15803d", "#166534", "#7f1d1d", "#991b1b"].map((c, i) => (
          <div key={i} className="w-4 h-4 rounded" style={{ background: c, border: "1px solid var(--color-bg-border)" }} />
        ))}
        <span>Daha fazla</span>
      </div>
    </div>
  );
}
