import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { format } from "date-fns";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function ResultBadge({ result }: { result: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    WIN:     { label: "WIN",     bg: "rgba(52,201,126,0.15)",  color: "var(--color-success)" },
    LOSS:    { label: "LOSS",    bg: "rgba(239,68,68,0.15)",   color: "var(--color-danger)" },
    BE:      { label: "BE",      bg: "rgba(245,158,11,0.15)",  color: "var(--color-warning)" },
    PARTIAL: { label: "PARTIAL", bg: "rgba(79,142,247,0.15)",  color: "var(--color-accent)" },
    MISSED:  { label: "MISSED",  bg: "rgba(144,144,160,0.15)", color: "var(--color-text-muted)" },
    NO_TRADE:{ label: "NO TRADE",bg: "rgba(144,144,160,0.15)", color: "var(--color-text-muted)" },
  };
  const s = map[result] ?? { label: result, bg: "transparent", color: "var(--color-text-muted)" };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const map: Record<string, { color: string }> = {
    A_PLUS: { color: "var(--color-success)" },
    B:      { color: "var(--color-accent)" },
    C:      { color: "var(--color-warning)" },
    RULE_BREAK: { color: "var(--color-danger)" },
  };
  const c = map[grade]?.color ?? "var(--color-text-muted)";
  return <span className="text-xs font-bold" style={{ color: c }}>{grade.replace("_", "+")}</span>;
}

export default async function JournalPage() {
  const user = await getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  const trades = dbUser
    ? await prisma.trade.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 50,
        include: { tags: { include: { tag: true } } },
      })
    : [];

  const wins   = trades.filter((t) => t.result === "WIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const total  = trades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result)).length;
  const avgR   = total > 0
    ? (trades.reduce((s, t) => s + (t.rResult ?? 0), 0) / total).toFixed(2)
    : "—";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {[
            { label: "Trades",   value: total },
            { label: "Win Rate", value: total > 0 ? `${Math.round((wins / total) * 100)}%` : "—" },
            { label: "Avg R",    value: avgR },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
        <Link
          href="/journal/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={12} /> Log Trade
        </Link>
      </div>

      {/* Trade list */}
      {trades.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <BookOpen size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No trades logged yet</p>
          <Link href="/journal/new" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "#fff" }}>
            Log your first trade
          </Link>
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
