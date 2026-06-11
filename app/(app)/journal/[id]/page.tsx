import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { TvChartWidget } from "@/components/tv-chart-widget";

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const trade = await prisma.trade.findFirst({
    where: { id, userId: user!.id },
    include: {
      tags: { include: { tag: true } },
      screenshots: true,
      dailyPrep: { select: { id: true, date: true, htfBias: true, goNoGoStatus: true } },
    },
  });

  if (!trade) notFound();

  const mistakeTags = trade.tags.filter((tt) => tt.tag.category === "MISTAKE").map((tt) => tt.tag.name);
  const positiveTags = trade.tags.filter((tt) => tt.tag.category === "POSITIVE").map((tt) => tt.tag.name);

  const gradeColor: Record<string, string> = {
    A_PLUS: "var(--color-success)", B: "var(--color-accent)",
    C: "var(--color-warning)", RULE_BREAK: "var(--color-danger)",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back */}
      <Link href="/journal" className="inline-flex items-center gap-1.5 text-xs hover:underline" style={{ color: "var(--color-text-muted)" }}>
        <ArrowLeft size={12} /> Back to Journal
      </Link>

      {/* Header */}
      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg font-bold" style={{ color: trade.direction === "LONG" ? "var(--color-long)" : "var(--color-short)" }}>
                {trade.direction}
              </span>
              <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{trade.instrument}</span>
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{trade.session?.replace("_", " ")}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {format(new Date(trade.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="text-right">
            {trade.processGrade && (
              <p className="text-2xl font-bold mb-0.5" style={{ color: gradeColor[trade.processGrade] ?? "var(--color-text-muted)" }}>
                {trade.processGrade.replace("_", "+")}
              </p>
            )}
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Process score: {trade.processScore ?? "—"}</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Result",  value: trade.result },
            { label: "R",       value: trade.rResult != null ? `${trade.rResult >= 0 ? "+" : ""}${trade.rResult.toFixed(1)}R` : "—" },
            { label: "Risk %",  value: trade.riskPercent ? `${trade.riskPercent}%` : "—" },
            { label: "Points",  value: trade.pnlPoints ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: "var(--color-bg-surface)" }}>
              <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{String(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            {trade.instrument} · TradingView Chart
          </p>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>H1</span>
        </div>
        <TvChartWidget instrument={trade.instrument} interval="60" height={420} />
      </div>

      {/* Entry details */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Entry Details</h3>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { label: "Entry", value: trade.entryPrice },
            { label: "Stop",  value: trade.stopPrice },
            { label: "TP1",   value: trade.tp1 },
            { label: "TP2",   value: trade.tp2 },
            { label: "TP3",   value: trade.tp3 },
            { label: "Model", value: trade.entryModel?.replace(/_/g, " ") },
          ].map(({ label, value }) => value != null && (
            <div key={label}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{String(value)}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 pt-2 border-t text-xs" style={{ borderColor: "var(--color-bg-border)" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Plan followed: <strong style={{ color: "var(--color-text-secondary)" }}>{trade.planFollowed ?? "—"}</strong></span>
          <span style={{ color: "var(--color-text-muted)" }}>GO status: <strong style={{ color: "var(--color-text-secondary)" }}>{trade.goStatusAtEntry?.replace(/_/g, " ") ?? "—"}</strong></span>
          {trade.dailyPrep && (
            <Link href={`/daily-prep/${trade.dailyPrep.id}`} className="hover:underline" style={{ color: "var(--color-accent)" }}>
              View linked prep →
            </Link>
          )}
        </div>
      </div>

      {/* Tags */}
      {(mistakeTags.length > 0 || positiveTags.length > 0) && (
        <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Tags</h3>
          {mistakeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {mistakeTags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-danger)" }}>{t}</span>
              ))}
            </div>
          )}
          {positiveTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {positiveTags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(52,201,126,0.12)", color: "var(--color-success)" }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Screenshots */}
      {trade.screenshots.length > 0 && (
        <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Screenshots</h3>
          <div className="grid grid-cols-2 gap-3">
            {trade.screenshots.map((sc) => (
              <div key={sc.id} className="space-y-1">
                <a href={sc.fileUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sc.fileUrl} alt={sc.screenshotType} className="w-full rounded-lg object-cover" style={{ aspectRatio: "16/9" }} />
                </a>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{sc.screenshotType.replace(/_/g, " ")}</p>
                {sc.notes && <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{sc.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Notes</h3>
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{trade.notes}</p>
        </div>
      )}
    </div>
  );
}
