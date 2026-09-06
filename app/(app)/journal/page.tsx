import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { JournalFilters } from "./journal-filters";
import { ExportCsvButton } from "./export-csv-button";
import { ResultBadge, GradeBadge } from "@/components/ui-kit/badge";
import { formatUsd } from "@/lib/money";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{
    instrument?: string;
    result?: string;
    session?: string;
    direction?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getUser();
  if (!user) return null;

  // Build filter where clause
  const where: Record<string, unknown> = { userId: user.id };
  if (sp.instrument) where.instrument = sp.instrument;
  if (sp.result)     where.result     = sp.result;
  if (sp.session)    where.session    = sp.session;
  if (sp.direction)  where.direction  = sp.direction;
  if (sp.dateFrom || sp.dateTo) {
    where.date = {};
    if (sp.dateFrom) (where.date as Record<string, unknown>).gte = new Date(sp.dateFrom);
    if (sp.dateTo)   (where.date as Record<string, unknown>).lte = new Date(sp.dateTo + "T23:59:59");
  }
  if (sp.search) {
    where.OR = [
      { instrument: { contains: sp.search, mode: "insensitive" } },
      { notes:      { contains: sp.search, mode: "insensitive" } },
    ];
  }

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { date: "desc" },
    take: 100,
    select: {
      id: true,
      date: true,
      instrument: true,
      direction: true,
      session: true,
      setupType: true,
      result: true,
      entryPrice: true,
      stopPrice: true,
      tp1: true,
      riskPercent: true,
      rResult: true,
      pnlPoints: true,
      pnlCurrency: true,
      processGrade: true,
      processScore: true,
      planFollowed: true,
      notes: true,
      tags: { select: { tag: { select: { name: true, category: true } } } },
    },
  });

  // Stats for filtered set
  const activeTrades = trades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  const wins   = activeTrades.filter((t) => t.result === "WIN").length;
  const total  = activeTrades.length;
  const avgR   = total > 0
    ? (activeTrades.reduce((s, t) => s + (t.rResult ?? 0), 0) / total).toFixed(2)
    : "—";
  const totalPnl = trades.reduce((s, t) => s + (t.pnlCurrency ?? 0), 0);

  const hasFilters = !!(sp.instrument || sp.result || sp.session || sp.direction || sp.dateFrom || sp.dateTo || sp.search);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {[
            { label: "Trade",    value: total },
            { label: "Win Rate", value: total > 0 ? `${Math.round((wins / total) * 100)}%` : "—" },
            { label: "Avg R",    value: avgR },
            { label: "Net P&L",  value: formatUsd(totalPnl, { decimals: 0, signed: true }) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton trades={trades} />
          <Link
            href="/journal/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            <Plus size={12} /> Log Trade
          </Link>
        </div>
      </div>

      {/* Filters */}
      <JournalFilters initialValues={sp} />

      {hasFilters && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>{trades.length} sonuç bulundu</span>
          <Link href="/journal" style={{ color: "var(--color-accent)" }}>Filtreleri temizle →</Link>
        </div>
      )}

      {/* Trade list */}
      {trades.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <BookOpen size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {hasFilters ? "Filtreye uyan trade bulunamadı" : "Henüz trade eklenmedi"}
          </p>
          {!hasFilters && (
            <Link href="/journal/new" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "#fff" }}>
              İlk trade&apos;i ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => {
            const mistakeTags = trade.tags.filter((tt) => tt.tag.category === "MISTAKE").map((tt) => tt.tag.name);
            const positiveTags = trade.tags.filter((tt) => tt.tag.category === "POSITIVE").map((tt) => tt.tag.name);
            return (
              <Link
                key={trade.id}
                href={`/journal/${trade.id}`}
                className="block rounded-xl border p-4 transition-colors"
                style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                      {format(new Date(trade.date), "MMM d")}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: trade.direction === "LONG" ? "var(--color-long)" : "var(--color-short)" }}
                    >
                      {trade.direction}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {trade.instrument}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {trade.session?.replace("_", " ")} · {trade.setupType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <GradeBadge grade={trade.processGrade} />
                    {trade.rResult !== null && (
                      <span
                        className="text-sm font-bold"
                        style={{ color: (trade.rResult ?? 0) >= 0 ? "var(--color-success)" : "var(--color-danger)" }}
                      >
                        {(trade.rResult ?? 0) >= 0 ? "+" : ""}{trade.rResult?.toFixed(1)}R
                      </span>
                    )}
                    <ResultBadge result={trade.result} />
                  </div>
                </div>

                {(mistakeTags.length > 0 || positiveTags.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mistakeTags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>{t}</span>
                    ))}
                    {positiveTags.slice(0, 2).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(52,201,126,0.1)", color: "var(--color-success)" }}>{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
