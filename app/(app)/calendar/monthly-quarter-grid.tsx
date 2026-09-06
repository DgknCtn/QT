import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getMonthlyQuarterWeeks, dayQuarter } from "./monthly-quarter";

const QUARTER_COLOR: Record<1 | 2 | 3 | 4, string> = {
  1: "var(--color-accent)",
  2: "var(--color-long)",
  3: "#f97316",
  4: "var(--color-danger)",
};

const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
// Weekly cycle: Pzt=Q1, Sal=Q2 (True Week Open), Çar=Q3, Per=Q4 — sabit ve deterministik
const DOW = ["Pzt · Q1", "Sal · TWO", "Çar · Q3", "Per · Q4", "Cum", "Cmt", "Paz"];

const impactColor: Record<string, string> = {
  HIGH: "var(--color-danger)",
  MEDIUM: "var(--color-warning)",
  LOW: "var(--color-accent)",
};

type DayEvent = { impact: string };

export function MonthlyQuarterGrid({
  year, month, eventsByDate,
}: {
  year: number;
  month: number; // 1-12
  eventsByDate: Record<string, DayEvent[]>;
}) {
  const bands = getMonthlyQuarterWeeks(year, month);

  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);
  const offset = (firstOfMonth.getDay() + 6) % 7; // Monday-first offset

  const cells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: lastOfMonth.getDate() }, (_, i) => new Date(year, month - 1, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevLink = `/calendar?qYear=${prevDate.getFullYear()}&qMonth=${prevDate.getMonth() + 1}`;
  const nextLink = `/calendar?qYear=${nextDate.getFullYear()}&qMonth=${nextDate.getMonth() + 1}`;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  function dateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Aylık Quarter (Q1-Q4)
        </h3>
        <div className="flex items-center gap-3">
          <Link
            href={prevLink}
            aria-label="Önceki ay"
            className="p-1 rounded hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
          </Link>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Link
            href={nextLink}
            aria-label="Sonraki ay"
            className="p-1 rounded hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="flex gap-3 text-xs flex-wrap" style={{ color: "var(--color-text-muted)" }}>
        {([1, 2, 3, 4] as const).map((q) => (
          <span key={q} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: QUARTER_COLOR[q] }} />
            Q{q}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DOW.map((d) => (
          <div key={d} className="text-center py-0.5 whitespace-nowrap" style={{ color: "var(--color-text-muted)", fontSize: 10 }}>{d}</div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((date, di) => {
              if (!date) return <div key={di} />;
              const q = dayQuarter(date, bands);
              const key = dateKey(date);
              const dayEvents = eventsByDate[key] ?? [];
              const isToday = isCurrentMonth && date.getDate() === today.getDate();
              return (
                <div
                  key={di}
                  className="rounded aspect-square flex flex-col items-center justify-center gap-0.5"
                  style={{
                    background: q ? `color-mix(in srgb, ${QUARTER_COLOR[q]} 16%, var(--color-bg-surface))` : "var(--color-bg-surface)",
                    border: isToday ? "1px solid var(--color-accent)" : "1px solid var(--color-bg-border)",
                    minHeight: 36,
                  }}
                >
                  <span className="text-xs" style={{ color: q ? QUARTER_COLOR[q] : "var(--color-text-muted)", fontWeight: q ? 700 : 400, fontSize: 11 }}>
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <span key={i} className="w-1 h-1 rounded-full" style={{ background: impactColor[ev.impact] ?? "var(--color-text-muted)" }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
