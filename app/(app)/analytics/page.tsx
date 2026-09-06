import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format, subDays, startOfMonth, startOfWeek } from "date-fns";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { CumulativeRChart } from "./cumulative-r-chart";
import { PnlHeatmap } from "./pnl-heatmap";
import { StatCard } from "@/components/ui-kit/stat-card";
import { DiagnosticsPanel } from "@/components/risk/diagnostics-panel";
import { computePerformance, computeAfterLoss } from "@/lib/risk/performance";
import { formatUsd } from "@/lib/money";
import { maxDrawdownR } from "@/lib/risk/drawdown";

// ─── helpers ───────────────────────────────────────────────────────────────

type Trade = Awaited<ReturnType<typeof loadTrades>>[number];

/**
 * Dönem filtresi SQL'e taşındı.
 *
 * Sorgu eskiden koşulsuz `take: 200` yapıyor, istatistikler de JS'te o 200
 * satır üstünde hesaplanıyordu — sayfadaki "tümü" seçeneği sessizce yalan
 * söylüyordu. Sınır artık dönemin kendisi; üst sınır yalnızca kaza koruması.
 */
async function loadTrades(userId: string, since: Date | null) {
  return prisma.trade.findMany({
    where: { userId, ...(since ? { date: { gte: since } } : {}) },
    orderBy: { date: "desc" },
    take: 5000,
    select: {
      id: true,
      date: true,
      instrument: true,
      direction: true,
      session: true,
      setupType: true,
      triad: true,
      result: true,
      rResult: true,
      pnlCurrency: true,
      processGrade: true,
      tags: { select: { tag: { select: { name: true, category: true } } } },
    },
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
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz işlem yok. Analiz için önce bir işlem kaydet ya da broker CSV’si içe aktar.</p>
          <Link href="/journal/new" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "#fff" }}>
            Log trade
          </Link>
        </div>
      </div>
    );
  }

  const pStart = periodStart(period);

  // Gerçek broker pozisyonları — manuel günlükten bağımsız. Analytics bugüne
  // kadar yalnızca `Trade` okuyordu, yani içe aktarılan gerçek P&L'e kördü.
  const [trades, brokerTrades] = await Promise.all([
    loadTrades(user.id, pStart),
    prisma.brokerTrade.findMany({
      where: { userId: user.id, ...(pStart ? { exitTime: { gte: pStart } } : {}) },
      // entryTime de cekiliyor: "kayiptan sonra acilan islem" olcumu acilis
      // anina bakmadan dogru olamaz (bkz. lib/risk/performance.ts).
      select: { netPnl: true, exitTime: true, entryTime: true },
    }),
  ]);

  const perf = computePerformance(brokerTrades);
  const afterLoss = computeAfterLoss(brokerTrades);

  if (trades.length === 0 && perf.count === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz işlem yok. Analiz için önce bir işlem kaydet ya da broker CSV’si içe aktar.</p>
          <Link href="/journal/new" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "#fff" }}>
            Log trade
          </Link>
        </div>
      </div>
    );
  }

  // Dönem filtresi sorguda uygulandı; burada yeniden süzmeye gerek yok.
  const ft = trades;

  // ── Overall stats (filtered) ──
  const wr = winRate(ft);
  const ar = avgR(ft);
  const active = ft.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  const totalR = ft.filter((t) => t.rResult != null).reduce((s, t) => s + (t.rResult ?? 0), 0);
  const totalPnl = ft.reduce((s, t) => s + (t.pnlCurrency ?? 0), 0);

  // ── Cumulative R curve (chronological, filtered) ──
  const chronoTrades = [...ft].reverse();
  // Accumulate inside the reducer instead of mutating an outer `let` while
  // mapping -- reassigning across renders is not allowed.
  // The running total stays unrounded; only the emitted value is rounded, so
  // rounding never compounds across the curve.
  const rCurve = chronoTrades
    .filter((t) => t.rResult != null)
    .reduce<{ rows: { label: string; r: number; cumR: number }[]; cum: number }>(
      (acc, t, i) => {
        const cum = acc.cum + (t.rResult ?? 0);
        acc.rows.push({
          label: `#${i + 1}`,
          r:     parseFloat((t.rResult ?? 0).toFixed(2)),
          cumR:  parseFloat(cum.toFixed(2)),
        });
        return { rows: acc.rows, cum };
      },
      { rows: [], cum: 0 }
    ).rows;

  // ── Max drawdown ──
  const mdd = maxDrawdownR(rCurve);

  // ── Grade distribution (filtered) ──
  const gradeMap = { A_PLUS: 0, B: 0, C: 0, RULE_BREAK: 0, UNREVIEWED: 0 };
  ft.forEach((t) => { if (t.processGrade) gradeMap[t.processGrade as keyof typeof gradeMap]++; });

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
          { value: "week",  label: "Bu Hafta" },
          { value: "month", label: "Bu Ay" },
          { value: "30d",   label: "Son 30 Gün" },
          { value: "90d",   label: "Son 90 Gün" },
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

      {/* Overall stats row.
          Bu satirin tamami MANUEL journal kayitlarindan hesaplanir. Broker'dan
          ice aktarilan gercek pozisyonlar asagidaki "Gercek sonuclar" panelinde.
          Etiket olmadan, yalnizca broker verisi yukleyen bir kullanici bu
          kartlari kendi gercek sonucu saniyordu. */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Manuel günlük
        </h2>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {ft.length} kayıt · kendi girdiğin plan ve sonuçlar
          {perf.count > 0 && ` · ${perf.count} içe aktarılmış pozisyon ayrıca aşağıda`}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Win Rate" value={wr != null ? `${wr}%` : null} sub={`${active.length} trade`} />
        <StatCard label="Avg R" value={ar} sub={`Toplam: ${totalR >= 0 ? "+" : ""}${totalR.toFixed(1)}R`} />
        <StatCard label="Net P&L" value={formatUsd(totalPnl, { decimals: 0, signed: true })} sub={`${ft.length} toplam trade`} />
        <StatCard
          label="Max Drawdown"
          value={rCurve.length > 0 ? `${mdd.toFixed(1)}R` : null}
          sub="kümülatif R eğrisinden"
          valueColor={mdd > 0 ? "#ef4444" : undefined}
        />
      </div>

      {/* Gercek broker sonuclari. Panel hesaplaniyor ve import ediliyordu ama
          JSX'e hic konmamisti; ana KPI'lar manuel veriden geldigi icin ice
          aktarilmis gercek P&L hicbir yerde gorunmuyordu. */}
      <DiagnosticsPanel perf={perf} afterLoss={afterLoss} />

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
            <Link href={prevHmLink} aria-label="Önceki ay" className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {monthNames[hmMonth - 1]} {hmYear}
            </span>
            {!isCurrentMonth && (
              <Link href={nextHmLink} aria-label="Sonraki ay" className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
                <ArrowRight size={14} aria-hidden="true" />
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
                    {formatUsd(row.totalPnl, { decimals: 0, signed: true })}
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


    </div>
  );
}
