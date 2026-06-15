import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format, startOfWeek, endOfWeek, subWeeks, subDays, startOfMonth } from "date-fns";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { CumulativeRChart } from "./cumulative-r-chart";
import { PnlHeatmap } from "./pnl-heatmap";

// ─── helpers ───────────────────────────────────────────────────────────────

type Trade = Awaited<ReturnType<typeof loadTrades>>[number];

async function loadTrades(userId: string) {
  return prisma.trade.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 200,
    include: { tags: { include: { tag: true } } },
  });
}

function winRate(trades: Trade[]) {
  const active = trades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  if (!active.length) return null;
  return Math.round((active.filter((t) => t.result === "WIN").length / active.length) * 100);
}

function avgR(trades: Trade[]) {
  const active = trades.filter((t) => t.rResult != null);
  if (!active.length) return null;
  return (active.reduce((s, t) => s + (t.rResult ?? 0), 0) / active.length).toFixed(2);
}

function maxDrawdownR(chronoRCurve: { cumR: number }[]): number {
  let peak = -Infinity;
  let dd = 0;
  for (const p of chronoRCurve) {
    if (p.cumR > peak) peak = p.cumR;
    const cur = peak - p.cumR;
    if (cur > dd) dd = cur;
  }
  return dd;
}

type Period = "all" | "week" | "month" | "30d" | "90d";

function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "week")  return startOfWeek(now, { weekStartsOn: 1 });
  if (period === "month") return startOfMonth(now);
  if (period === "30d")   return subDays(now, 30);
  if (period === "90d")   return subDays(now, 90);
  return null;
}

function groupBy<T>(arr: T[], key: (t: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, t) => {
    const k = key(t);
    (acc[k] ??= []).push(t);
    return acc;
  }, {});
}

function statsFor(trades: Trade[]) {
  const active = trades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  const wins = active.filter((t) => t.result === "WIN").length;
  const wr = active.length ? Math.round((wins / active.length) * 100) : null;
  const rTrades = trades.filter((t) => t.rResult != null);
  const ar = rTrades.length
    ? (rTrades.reduce((s, t) => s + (t.rResult ?? 0), 0) / rTrades.length).toFixed(1)
    : null;
  const totalPnl = trades.reduce((s, t) => s + (t.pnlCurrency ?? 0), 0);
  return { count: active.length, wins, wr, ar, totalPnl };
}

// ─── components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, valueColor }: { label: string; value: string | number | null; sub?: string; valueColor?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: valueColor ?? "var(--color-text-primary)" }}>{value ?? "—"}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

function BreakdownTable({
  title, rows,
}: {
  title: string;
  rows: { label: string; count: number; wr: number | null; ar: string | null }[];
}) {
  const maxCount = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{title}</h3>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between mb-1 text-xs">
              <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {row.count} trades · WR {row.wr != null ? `${row.wr}%` : "—"} · Avg R {row.ar ?? "—"}
              </span>
            </div>
            <MiniBar pct={(row.count / maxCount) * 100} color="var(--color-accent)" />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No data yet</p>
        )}
      </div>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; heatmapYear?: string; heatmapMonth?: string; period?: string }>;
}) {
  const sp = await searchParams;
  const period = (sp.period ?? "all") as Period;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No trades yet. Log your first trade to see analytics.</p>
          <Link href="/journal/new" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "#fff" }}>
            Log trade
          </Link>
        </div>
      </div>
    );
  }

  const trades = await loadTrades(user.id);
  if (trades.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No trades yet. Log your first trade to see analytics.</p>
          <Link href="/journal/new" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "#fff" }}>
            Log trade
          </Link>
        </div>
      </div>
    );
  }

  // ── Period filter ──
  const pStart = periodStart(period);
  const ft = pStart ? trades.filter((t) => new Date(t.date) >= pStart) : trades;

  // ── Overall stats (filtered) ──
  const wr = winRate(ft);
  const ar = avgR(ft);
  const active = ft.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  const totalR = ft.filter((t) => t.rResult != null).reduce((s, t) => s + (t.rResult ?? 0), 0);
  const totalPnl = ft.reduce((s, t) => s + (t.pnlCurrency ?? 0), 0);

  // ── Cumulative R curve (chronological, filtered) ──
  const chronoTrades = [...ft].reverse();
  let cum = 0;
  const rCurve = chronoTrades
    .filter((t) => t.rResult != null)
    .map((t, i) => {
      cum += t.rResult ?? 0;
      return {
        label: `#${i + 1}`,
        r:     parseFloat((t.rResult ?? 0).toFixed(2)),
        cumR:  parseFloat(cum.toFixed(2)),
      };
    });

  // ── Max drawdown ──
  const mdd = maxDrawdownR(rCurve);

  // ── Grade distribution (filtered) ──
  const gradeMap = { A_PLUS: 0, B: 0, C: 0, RULE_BREAK: 0, UNREVIEWED: 0 };
  ft.forEach((t) => { if (t.processGrade) gradeMap[t.processGrade as keyof typeof gradeMap]++; });

  // ── Setup breakdown (filtered) ──
  const bySetup = groupBy(ft, (t) => t.setupType ?? "UNKNOWN");
  const setupRows = Object.entries(bySetup)
    .map(([label, ts]) => ({ label: label.replace(/_/g, " "), ...statsFor(ts) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── Session breakdown (filtered) ──
  const bySession = groupBy(ft, (t) => t.session?.replace(/_/g, " ") ?? "Unknown");
  const sessionRows = Object.entries(bySession)
    .map(([label, ts]) => ({ label, ...statsFor(ts) }))
    .sort((a, b) => b.count - a.count);

  // ── Triad breakdown (filtered) ──
  const byTriad = groupBy(ft, (t) => t.triad ?? "Unknown");
  const triadRows = Object.entries(byTriad)
    .map(([label, ts]) => ({ label, ...statsFor(ts) }))
    .sort((a, b) => b.count - a.count);

  // ── Instrument breakdown (filtered) ──
  const byInstrument = groupBy(ft, (t) => t.instrument);
  const instrumentRows = Object.entries(byInstrument)
    .map(([instrument, ts]) => {
      const s = statsFor(ts);
      return {
        instrument,
        count: ts.length,
        activeCount: s.count,
        wins: s.wins,
        wr: s.wr,
        ar: s.ar,
        totalPnl: s.totalPnl,
        longs: ts.filter((t) => t.direction === "LONG").length,
        shorts: ts.filter((t) => t.direction === "SHORT").length,
      };
    })
    .sort((a, b) => b.count - a.count);

  // ── Mistake tag frequency (filtered) ──
  const mistakeCounts: Record<string, number> = {};
  ft.forEach((t) =>
    t.tags
      .filter((tt) => tt.tag.category === "MISTAKE")
      .forEach((tt) => { mistakeCounts[tt.tag.name] = (mistakeCounts[tt.tag.name] ?? 0) + 1; })
  );
  const topMistakes = Object.entries(mistakeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxMistake = topMistakes[0]?.[1] ?? 1;

  // ── Positive tag frequency (filtered) ──
  const positiveCounts: Record<string, number> = {};
  ft.forEach((t) =>
    t.tags
      .filter((tt) => tt.tag.category === "POSITIVE")
      .forEach((tt) => { positiveCounts[tt.tag.name] = (positiveCounts[tt.tag.name] ?? 0) + 1; })
  );
  const topPositives = Object.entries(positiveCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxPositive = topPositives[0]?.[1] ?? 1;

  // ── Weekly review ──
  const weekOffset = parseInt(sp.week ?? "0", 10);
  const weekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekTrades = trades.filter((t) => {
    const d = new Date(t.date);
    return d >= weekStart && d <= weekEnd;
  });
  const weekStats = statsFor(weekTrades);
  const weekR = weekTrades.filter((t) => t.rResult != null).reduce((s, t) => s + (t.rResult ?? 0), 0);

  // ── P&L Heatmap (Feature 2) ──
  const now = new Date();
  const hmYear  = parseInt(sp.heatmapYear  ?? String(now.getFullYear()), 10);
  const hmMonth = parseInt(sp.heatmapMonth ?? String(now.getMonth() + 1), 10);

  const heatmapDays: Record<string, { pnl: number; count: number; trades: { id: string; instrument: string; direction: string | null; result: string | null; pnlCurrency: number | null; rResult: number | null; session: string | null }[] }> = {};
  trades.forEach((t) => {
    const d = new Date(t.date);
    if (d.getFullYear() === hmYear && d.getMonth() + 1 === hmMonth) {
      const key = format(d, "yyyy-MM-dd");
      if (!heatmapDays[key]) heatmapDays[key] = { pnl: 0, count: 0, trades: [] };
      heatmapDays[key].pnl   += t.pnlCurrency ?? 0;
      heatmapDays[key].count += 1;
      heatmapDays[key].trades.push({
        id: t.id,
        instrument: t.instrument,
        direction: t.direction ?? null,
        result: t.result ?? null,
        pnlCurrency: t.pnlCurrency ?? null,
        rResult: t.rResult ?? null,
        session: t.session ?? null,
      });
    }
  });
  const heatmapData = Object.entries(heatmapDays).map(([date, v]) => ({ date, ...v }));

  // Prev/next month links
  const prevHmDate = new Date(hmYear, hmMonth - 2, 1);
  const nextHmDate = new Date(hmYear, hmMonth, 1);
  const prevHmLink = `/analytics?heatmapYear=${prevHmDate.getFullYear()}&heatmapMonth=${prevHmDate.getMonth() + 1}`;
  const nextHmLink = `/analytics?heatmapYear=${nextHmDate.getFullYear()}&heatmapMonth=${nextHmDate.getMonth() + 1}`;
  const isCurrentMonth = hmYear === now.getFullYear() && hmMonth === now.getMonth() + 1;

  const gradeColor: Record<string, string> = {
    A_PLUS: "var(--color-success)", B: "var(--color-accent)",
    C: "var(--color-warning)", RULE_BREAK: "var(--color-danger)",
    UNREVIEWED: "var(--color-text-muted)",
  };

  const monthNames = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header with CSV export */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Analytics</h1>
        <a
          href="/api/trades/export"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)", color: "var(--color-text-secondary)" }}
        >
          <Download size={12} /> CSV İndir
        </a>
      </div>

      {/* Period filter */}
      {(() => {
        const PERIODS: { value: Period; label: string }[] = [
          { value: "all",   label: "Tümü" },
          { value: "month", label: "Bu Ay" },
          { value: "30d",   label: "Son 30 Gün" },
          { value: "90d",   label: "Son 90 Gün" },
          { value: "week",  label: "Bu Hafta" },
        ];
        return (
          <div className="flex gap-1.5 flex-wrap">
            {PERIODS.map((p) => (
              <Link
                key={p.value}
                href={`/analytics?period=${p.value}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  background: period === p.value ? "var(--color-accent)" : "var(--color-bg-elevated)",
                  borderColor: period === p.value ? "var(--color-accent)" : "var(--color-bg-border)",
                  color: period === p.value ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {p.label}
              </Link>
            ))}
          </div>
        );
      })()}

      {/* Overall stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Win Rate" value={wr != null ? `${wr}%` : null} sub={`${active.length} trade`} />
        <StatCard label="Avg R" value={ar} sub={`Toplam: ${totalR >= 0 ? "+" : ""}${totalR.toFixed(1)}R`} />
        <StatCard
          label="Max Drawdown"
          value={mdd > 0 ? `-${mdd.toFixed(1)}R` : "—"}
          sub="peak-to-trough"
          valueColor={mdd > 0 ? "var(--color-danger)" : undefined}
        />
        <StatCard label="Net P&L" value={`${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toFixed(0)}`} sub={`${ft.length} toplam trade`} />
      </div>

      {/* Cumulative R chart */}
      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
          Kümülatif R Eğrisi · {rCurve.length} trade
        </p>
        {rCurve.length > 1 ? (
          <CumulativeRChart points={rCurve} />
        ) : (
          <p className="text-xs py-6 text-center" style={{ color: "var(--color-text-muted)" }}>En az 2 R değeri olan trade gerekli</p>
        )}
      </div>

      {/* P&L Heatmap Calendar (Feature 2) */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            P&L Takvimi
          </h3>
          <div className="flex items-center gap-3">
            <Link href={prevHmLink} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
              <ArrowLeft size={14} />
            </Link>
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {monthNames[hmMonth - 1]} {hmYear}
            </span>
            {!isCurrentMonth && (
              <Link href={nextHmLink} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
        <PnlHeatmap days={heatmapData} year={hmYear} month={hmMonth} />
      </div>

      {/* Instrument Performance (Feature 3) */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Enstrüman Analizi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: "var(--color-text-muted)" }}>
                <th className="text-left pb-2 pr-4">Enstrüman</th>
                <th className="text-right pb-2 px-3">Trade</th>
                <th className="text-right pb-2 px-3">WR %</th>
                <th className="text-right pb-2 px-3">Avg R</th>
                <th className="text-right pb-2 px-3">Net P&L</th>
                <th className="text-right pb-2 px-3">Long/Short</th>
              </tr>
            </thead>
            <tbody>
              {instrumentRows.map((row) => (
                <tr key={row.instrument} className="border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                  <td className="py-2 pr-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>{row.instrument}</td>
                  <td className="py-2 px-3 text-right" style={{ color: "var(--color-text-secondary)" }}>{row.activeCount}</td>
                  <td className="py-2 px-3 text-right font-medium" style={{ color: (row.wr ?? 0) >= 50 ? "#34c97e" : "#ef4444" }}>
                    {row.wr != null ? `${row.wr}%` : "—"}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: parseFloat(row.ar ?? "0") >= 0 ? "#34c97e" : "#ef4444" }}>
                    {row.ar != null ? `${parseFloat(row.ar) >= 0 ? "+" : ""}${row.ar}R` : "—"}
                  </td>
                  <td className="py-2 px-3 text-right font-medium" style={{ color: row.totalPnl >= 0 ? "#34c97e" : "#ef4444" }}>
                    {row.totalPnl >= 0 ? "+" : ""}${Math.abs(row.totalPnl).toFixed(0)}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: "var(--color-text-muted)" }}>
                    <span style={{ color: "var(--color-long)" }}>{row.longs}L</span>
                    {" / "}
                    <span style={{ color: "var(--color-short)" }}>{row.shorts}S</span>
                  </td>
                </tr>
              ))}
              {instrumentRows.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center" style={{ color: "var(--color-text-muted)" }}>Henüz data yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade distribution */}
      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>Process Grade Distribution</h3>
        <div className="flex gap-3">
          {(["A_PLUS", "B", "C", "RULE_BREAK", "UNREVIEWED"] as const).map((g) => {
            const count = gradeMap[g];
            const pct = trades.length ? Math.round((count / trades.length) * 100) : 0;
            return (
              <div key={g} className="flex-1 text-center">
                <div className="rounded-lg p-2 mb-1.5" style={{ background: "var(--color-bg-surface)" }}>
                  <p className="text-lg font-bold" style={{ color: gradeColor[g] }}>{count}</p>
                  <p className="text-xs" style={{ color: gradeColor[g] }}>{g.replace("_", "+")}</p>
                </div>
                <MiniBar pct={pct} color={gradeColor[g]} />
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdowns row */}
      <div className="grid md:grid-cols-2 gap-4">
        <BreakdownTable title="By Setup Type" rows={setupRows} />
        <BreakdownTable title="By Session" rows={sessionRows} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <BreakdownTable title="By Triad" rows={triadRows} />

        {/* Mistake tags */}
        <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Top Mistakes</h3>
          {topMistakes.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No mistakes tagged</p>
          ) : (
            <div className="space-y-2.5">
              {topMistakes.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between mb-1 text-xs">
                    <span style={{ color: "var(--color-danger)" }}>{name}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{count}×</span>
                  </div>
                  <MiniBar pct={(count / maxMistake) * 100} color="var(--color-danger)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Positive tags */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Güçlü Yönler</h3>
        {topPositives.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Henüz pozitif tag eklenmedi</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2.5">
            {topPositives.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between mb-1 text-xs">
                  <span style={{ color: "var(--color-success)" }}>{name}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>{count}×</span>
                </div>
                <MiniBar pct={(count / maxPositive) * 100} color="var(--color-success)" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Review */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Weekly Review — {format(weekStart, "MMM d")} to {format(weekEnd, "MMM d, yyyy")}
          </h3>
          <div className="flex gap-2">
            <Link
              href={`/analytics?week=${weekOffset + 1}`}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <ArrowLeft size={14} />
            </Link>
            {weekOffset > 0 && (
              <Link
                href={`/analytics?week=${weekOffset - 1}`}
                className="p-1 rounded hover:bg-white/5 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Week stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Trades",   value: weekStats.count },
            { label: "Wins",     value: weekStats.wins },
            { label: "Win Rate", value: weekStats.wr != null ? `${weekStats.wr}%` : "—" },
            { label: "Net R",    value: weekR !== 0 ? `${weekR >= 0 ? "+" : ""}${weekR.toFixed(1)}R` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: "var(--color-bg-surface)" }}>
              <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Trade list for the week */}
        {weekTrades.length === 0 ? (
          <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>No trades this week.</p>
        ) : (
          <div className="space-y-1.5">
            {weekTrades.map((t) => {
              const mistakes = t.tags.filter((tt) => tt.tag.category === "MISTAKE");
              return (
                <Link
                  key={t.id}
                  href={`/journal/${t.id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: "var(--color-bg-surface)" }}
                >
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "var(--color-text-muted)" }}>{format(new Date(t.date), "EEE dd")}</span>
                    <span style={{ color: t.direction === "LONG" ? "var(--color-long)" : "var(--color-short)" }}>{t.direction}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{t.instrument}</span>
                    {mistakes.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
                        {mistakes.length} mistake{mistakes.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {t.processGrade && (
                      <span className="font-bold" style={{ color: gradeColor[t.processGrade] ?? "var(--color-text-muted)" }}>
                        {t.processGrade.replace("_", "+")}
                      </span>
                    )}
                    {t.rResult != null && (
                      <span className="font-bold" style={{ color: t.rResult >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {t.rResult >= 0 ? "+" : ""}{t.rResult.toFixed(1)}R
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: t.result === "WIN" ? "rgba(52,201,126,0.15)" : t.result === "LOSS" ? "rgba(239,68,68,0.15)" : "rgba(144,144,160,0.1)",
                        color: t.result === "WIN" ? "var(--color-success)" : t.result === "LOSS" ? "var(--color-danger)" : "var(--color-text-muted)",
                      }}
                    >
                      {t.result}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
