import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewForm } from "./review-form";

const GRADE_COLORS: Record<string, string> = {
  A_PLUS: "#34c97e", B: "#6366f1", C: "#f59e0b", RULE_BREAK: "#ef4444", UNREVIEWED: "#6b7280",
};
const RESULT_COLORS: Record<string, string> = {
  WIN: "#34c97e", LOSS: "#ef4444", BE: "#f59e0b", PARTIAL: "#6366f1",
};
const RATING_COLORS: Record<number, string> = {
  1: "#ef4444", 2: "#f97316", 3: "#f59e0b", 4: "#84cc16", 5: "#34c97e",
};

export default async function WeeklyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekOffset = parseInt(sp.w ?? "0", 10);
  const weekStart  = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd    = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const [trades, existing, pastReviews] = await Promise.all([
    prisma.trade.findMany({
      where: {
        userId: user.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.weeklyReview.findUnique({
      where: { userId_weekStart: { userId: user.id, weekStart } },
    }),
    prisma.weeklyReview.findMany({
      where: { userId: user.id, weekStart: { lt: weekStart } },
      orderBy: { weekStart: "desc" },
      take: 10,
    }),
  ]);

  const wins    = trades.filter((t) => t.result === "WIN").length;
  const losses  = trades.filter((t) => t.result === "LOSS").length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const netR    = trades.reduce((s, t) => s + (t.rResult ?? 0), 0);
  const netPnl  = trades.reduce((s, t) => s + (t.pnlCurrency ?? 0), 0);
  const gradeCounts: Record<string, number> = {};
  trades.forEach((t) => {
    if (t.processGrade) gradeCounts[t.processGrade] = (gradeCounts[t.processGrade] ?? 0) + 1;
  });

  const isCurrentWeek = weekOffset === 0;
  const prevLink = `/weekly-review?w=${weekOffset + 1}`;
  const nextLink = `/weekly-review?w=${Math.max(weekOffset - 1, 0)}`;

  return (
    <div className="p-6 max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Haftalık Review</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {format(weekStart, "d MMM", { locale: tr })} – {format(weekEnd, "d MMM yyyy", { locale: tr })}
            {isCurrentWeek && <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-accent)" }}>Bu hafta</span>}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={prevLink}
            className="p-2 rounded-lg border transition-colors"
            style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)", background: "var(--color-bg-elevated)" }}>
            <ChevronLeft size={14} />
          </Link>
          <Link href={nextLink}
            className="p-2 rounded-lg border transition-colors"
            style={{
              borderColor: "var(--color-bg-border)",
              color: isCurrentWeek ? "var(--color-bg-border)" : "var(--color-text-muted)",
              background: "var(--color-bg-elevated)",
              pointerEvents: isCurrentWeek ? "none" : undefined,
            }}>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: trade stats */}
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Trade",    value: trades.length },
              { label: "Win Rate", value: `${winRate}%` },
              { label: "Net R",    value: `${netR >= 0 ? "+" : ""}${netR.toFixed(2)}R` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border p-3 text-center" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
                <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Net P&L */}
          {netPnl !== 0 && (
            <div className="rounded-xl border p-3 text-center" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
              <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Net P&L</p>
              <p className="text-2xl font-black" style={{ color: netPnl >= 0 ? "#34c97e" : "#ef4444" }}>
                {netPnl >= 0 ? "+" : ""}${Math.abs(netPnl).toFixed(0)}
              </p>
            </div>
          )}

          {/* Grade breakdown */}
          {Object.keys(gradeCounts).length > 0 && (
            <div className="rounded-xl border p-4 space-y-2" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Process Grade</p>
              {Object.entries(gradeCounts).map(([grade, count]) => (
                <div key={grade} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-20" style={{ color: GRADE_COLORS[grade] ?? "#6b7280" }}>
                    {grade.replace("_", "+")}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / trades.length) * 100}%`, background: GRADE_COLORS[grade] ?? "#6b7280" }} />
                  </div>
                  <span className="text-xs w-4 text-right" style={{ color: "var(--color-text-muted)" }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Trade list */}
          {trades.length > 0 ? (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
              <div className="px-4 py-2.5 border-b" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Trade Listesi</p>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--color-bg-border)" }}>
                {trades.map((t) => {
                  const mistakeCount = t.tags.filter((tt) => tt.tag.category === "MISTAKE").length;
                  return (
                    <Link key={t.id} href={`/journal/${t.id}`}
                      className="flex items-center justify-between px-4 py-2.5 hover:opacity-80 transition-opacity"
                      style={{ background: "var(--color-bg-surface)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {format(new Date(t.date), "EEE dd", { locale: tr })}
                        </span>
                        <span className="text-xs font-bold"
                          style={{ color: t.direction === "LONG" ? "#34c97e" : "#ef4444" }}>
                          {t.direction?.slice(0, 1)}
                        </span>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{t.instrument}</span>
                        {mistakeCount > 0 && (
                          <span className="text-xs px-1 rounded" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                            {mistakeCount} hata
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {t.processGrade && (
                          <span className="text-xs font-bold" style={{ color: GRADE_COLORS[t.processGrade] ?? "#6b7280" }}>
                            {t.processGrade.replace("_", "+")}
                          </span>
                        )}
                        {t.rResult != null && (
                          <span className="text-xs font-mono" style={{ color: t.rResult >= 0 ? "#34c97e" : "#ef4444" }}>
                            {t.rResult >= 0 ? "+" : ""}{t.rResult.toFixed(1)}R
                          </span>
                        )}
                        {t.result && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                            style={{ background: `${RESULT_COLORS[t.result] ?? "#6b7280"}20`, color: RESULT_COLORS[t.result] ?? "#6b7280" }}>
                            {t.result}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border flex items-center justify-center py-10"
              style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Bu haftaya ait trade kaydı yok</p>
            </div>
          )}
        </div>

        {/* Right: reflection form */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Yansıma & Notlar</h2>
            {existing && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(52,201,126,0.1)", color: "#34c97e" }}>
                Kaydedilmiş review var
              </span>
            )}
          </div>
          <ReviewForm weekStart={weekStartStr} existing={existing} />
        </div>
      </div>

      {/* Past reviews list */}
      {pastReviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Geçmiş Reviewlar</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pastReviews.map((r) => {
              const wStart = new Date(r.weekStart);
              const wEnd   = endOfWeek(wStart, { weekStartsOn: 1 });
              const offset = Math.round((new Date().getTime() - wStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
              return (
                <Link key={r.id} href={`/weekly-review?w=${offset}`}
                  className="rounded-xl border p-4 space-y-2 block transition-opacity hover:opacity-80"
                  style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {format(wStart, "d MMM", { locale: tr })} – {format(wEnd, "d MMM", { locale: tr })}
                    </p>
                    {r.overallRating && (
                      <span className="text-sm font-black" style={{ color: RATING_COLORS[r.overallRating] }}>
                        {r.overallRating}/5
                      </span>
                    )}
                  </div>
                  {r.wentWell && (
                    <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                      ✓ {r.wentWell}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
