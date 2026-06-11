import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import {
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Ban,
  BarChart3,
  Wallet,
} from "lucide-react";
import { MarketClockPanel } from "@/components/market-clock/market-clock-panel";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
    </div>
  );
}

function GoNoGoBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>No prep today</span>;
  const map: Record<string, { label: string; color: string }> = {
    GO:           { label: "GO",           color: "var(--color-go)" },
    NO_GO:        { label: "NO-GO",        color: "var(--color-nogo)" },
    WAIT:         { label: "WAIT",         color: "var(--color-wait)" },
    REVIEW_LATER: { label: "REVIEW LATER", color: "var(--color-wait)" },
    MISSED_SETUP: { label: "MISSED",       color: "var(--color-text-muted)" },
  };
  const item = map[status] ?? { label: status, color: "var(--color-text-secondary)" };
  return <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const greeting = getGreeting();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const dbUser = user ? await prisma.user.findUnique({ where: { id: user.id } }) : null;

  // Today's prep
  const todayPrep = dbUser
    ? await prisma.dailyPrep.findFirst({
        where: { userId: user!.id, date: { gte: todayStart, lte: todayEnd } },
        orderBy: { createdAt: "desc" },
      }).catch(() => null)
    : null;

  // Recent preps (last 5)
  const recentPreps = dbUser
    ? await prisma.dailyPrep.findMany({
        where: { userId: user!.id },
        orderBy: { date: "desc" },
        take: 5,
        select: { id: true, date: true, htfBias: true, goNoGoStatus: true, triad: true, session: true },
      }).catch(() => [])
    : [];

  // This week trades
  const weekTrades = dbUser
    ? await prisma.trade.findMany({
        where: { userId: user!.id, date: { gte: weekStart, lte: weekEnd } },
        select: { result: true, rResult: true, processScore: true },
      }).catch(() => [])
    : [];

  const activeWeekTrades = weekTrades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  const weekWins = activeWeekTrades.filter((t) => t.result === "WIN").length;
  const weekWR = activeWeekTrades.length > 0 ? Math.round((weekWins / activeWeekTrades.length) * 100) : null;
  const avgScore = weekTrades.filter((t) => t.processScore != null).length > 0
    ? (weekTrades.reduce((s, t) => s + (t.processScore ?? 0), 0) / weekTrades.filter((t) => t.processScore != null).length).toFixed(1)
    : null;

  // Active funded accounts
  const activeAccounts = dbUser
    ? await prisma.fundedAccount.findMany({
        where:   { userId: user!.id, status: "ACTIVE" },
        include: { equityLogs: { where: { date: { gte: todayStart } }, take: 1, orderBy: { date: "desc" } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }).catch(() => [])
    : [];

  // Today's economic events
  const todayEvents = dbUser
    ? await prisma.economicEvent.findMany({
        where: { userId: user!.id, dateTime: { gte: todayStart, lte: todayEnd } },
        orderBy: { dateTime: "asc" },
      }).catch(() => [])
    : [];

  const highRiskEvents = todayEvents.filter((e) => ["HIGH_RISK", "NO_TRADE_WINDOW"].includes(e.userRiskTag ?? "") || e.impact === "HIGH");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
            {format(now, "EEEE, MMMM d, yyyy")}
          </p>
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {greeting}, {user?.user_metadata?.name || user?.email?.split("@")[0] || "Trader"}
          </h2>
        </div>
        <Link
          href="/daily-prep/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <ClipboardList size={14} />
          {todayPrep ? "New Prep" : "Start Daily Prep"}
        </Link>
      </div>

      {/* High-risk news banner */}
      {highRiskEvents.length > 0 && (
        <div
          className="rounded-xl border px-4 py-3 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }}
        >
          <Ban size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-danger)" }}>
              High-risk events today — review no-trade windows
            </p>
            <div className="flex flex-wrap gap-2">
              {highRiskEvents.map((ev) => (
                <span key={ev.id} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {format(new Date(ev.dateTime), "HH:mm")} · {ev.currency} {ev.eventName}
                </span>
              ))}
            </div>
          </div>
          <Link href="/calendar" className="ml-auto flex-shrink-0 text-xs" style={{ color: "var(--color-accent)" }}>View →</Link>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Today's Prep"
          value={todayPrep ? (todayPrep.goNoGoStatus ?? "—") : "—"}
          sub={todayPrep ? todayPrep.htfBias ?? "No bias" : "Not started"}
        />
        <StatCard
          label="This Week"
          value={activeWeekTrades.length}
          sub={weekWR != null ? `${weekWR}% win rate` : "0 trades"}
        />
        <StatCard
          label="Avg Process"
          value={avgScore ?? "—"}
          sub="this week"
        />
      </div>

      {/* Funded Account widget */}
      {activeAccounts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Funded Accounts</p>
            <Link href="/accounts" className="text-xs" style={{ color: "var(--color-accent)" }}>Tümü →</Link>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(activeAccounts.length, 3)}, 1fr)` }}>
            {activeAccounts.map((acc) => {
              const profit    = acc.currentEquity - acc.startingBalance;
              const profitPct = (profit / acc.startingBalance) * 100;
              const todayPnl  = acc.equityLogs[0]?.pnlToday ?? null;
              const todayLoss = todayPnl !== null && todayPnl < 0 ? Math.abs(todayPnl) : 0;
              const drawdown  = Math.abs(Math.min(profit, 0));
              const atRisk    = todayLoss >= acc.maxDailyLoss * 0.8 || drawdown >= acc.maxTotalLoss * 0.8;
              return (
                <Link
                  key={acc.id}
                  href={`/accounts/${acc.id}`}
                  className="rounded-xl border p-4 space-y-2.5 block"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: atRisk ? "#ef4444" : "var(--color-bg-border)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                        {acc.firmName} · Phase {acc.phase}
                      </p>
                      <p className="text-lg font-mono font-bold mt-0.5" style={{ color: "var(--color-text-primary)" }}>
                        ${acc.currentEquity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <Wallet size={14} style={{ color: atRisk ? "#ef4444" : "var(--color-text-muted)" }} />
                  </div>
                  {/* Profit target bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                      <span>Hedef</span>
                      <span style={{ color: profit >= acc.profitTarget ? "#34c97e" : "inherit" }}>
                        {profit >= 0 ? "+" : ""}{profitPct.toFixed(1)}% / %{((acc.profitTarget / acc.startingBalance) * 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((Math.max(profit, 0) / acc.profitTarget) * 100, 100)}%`,
                          background: profit >= acc.profitTarget ? "#34c97e" : "#6366f1",
                        }}
                      />
                    </div>
                  </div>
                  {atRisk && (
                    <p className="text-xs font-medium" style={{ color: "#ef4444" }}>⚠ Risk limitine yakın</p>
                  )}
                  {todayPnl !== null && (
                    <p className="text-xs font-mono" style={{ color: todayPnl >= 0 ? "#34c97e" : "#ef4444" }}>
                      Bugün: {todayPnl >= 0 ? "+" : ""}{todayPnl.toFixed(2)}$
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Market Clock Panel */}
      <MarketClockPanel />

      {/* Main cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bias card */}
        <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Today&apos;s Bias</p>
            <TrendingUp size={14} style={{ color: "var(--color-text-muted)" }} />
          </div>
          {todayPrep ? (
            <>
              <p className="text-2xl font-bold mb-1" style={{ color: todayPrep.htfBias === "LONG" ? "var(--color-long)" : todayPrep.htfBias === "SHORT" ? "var(--color-short)" : "var(--color-text-muted)" }}>
                {todayPrep.htfBias ?? "NEUTRAL"}
              </p>
              <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
                {todayPrep.triad?.replace(/_/g, " ")} · {todayPrep.session?.replace(/_/g, " ")}
              </p>
              <div className="pt-3 border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                <GoNoGoBadge status={todayPrep.goNoGoStatus} />
              </div>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>—</p>
              <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>No daily prep yet</p>
              <div className="pt-3 border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                <GoNoGoBadge status={null} />
              </div>
            </>
          )}
        </div>

        {/* News card */}
        <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Today&apos;s Events</p>
            <AlertTriangle size={14} style={{ color: "var(--color-text-muted)" }} />
          </div>
          {todayEvents.length === 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No events</p>
              <Link href="/calendar" className="text-xs" style={{ color: "var(--color-accent)" }}>Add news events →</Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todayEvents.slice(0, 4).map((ev) => {
                const isRisky = ["HIGH_RISK", "NO_TRADE_WINDOW"].includes(ev.userRiskTag ?? "") || ev.impact === "HIGH";
                return (
                  <div key={ev.id} className="flex items-center gap-2">
                    <span className="text-xs font-mono w-10 flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>
                      {format(new Date(ev.dateTime), "HH:mm")}
                    </span>
                    {isRisky && <Ban size={10} style={{ color: "var(--color-danger)" }} />}
                    <span className="text-xs truncate" style={{ color: isRisky ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
                      {ev.currency} {ev.eventName}
                    </span>
                  </div>
                );
              })}
              {todayEvents.length > 4 && (
                <Link href="/calendar" className="text-xs" style={{ color: "var(--color-accent)" }}>
                  +{todayEvents.length - 4} more →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Quick Actions
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Link href="/daily-prep/new" className="qa-card">
            <ClipboardList size={14} style={{ color: "var(--color-accent)" }} />
            New Daily Prep
          </Link>
          <Link href="/journal/new" className="qa-card">
            <TrendingUp size={14} style={{ color: "var(--color-accent)" }} />
            Log Trade
          </Link>
          <Link href="/analytics" className="qa-card">
            <BarChart3 size={14} style={{ color: "var(--color-accent)" }} />
            Weekly Review
          </Link>
        </div>
      </div>

      {/* Recent preps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            Recent Daily Preps
          </p>
          <Link href="/daily-prep" className="text-xs hover:underline" style={{ color: "var(--color-accent)" }}>
            View all
          </Link>
        </div>
        {recentPreps.length === 0 ? (
          <div
            className="rounded-xl border flex items-center justify-center py-10 text-sm"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)" }}
          >
            No preps yet — start your first daily prep above
          </div>
        ) : (
          <div className="space-y-2">
            {recentPreps.map((prep) => (
              <Link
                key={prep.id}
                href={`/daily-prep/${prep.id}`}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
              >
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>{format(new Date(prep.date), "EEE, MMM d")}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{prep.triad?.replace(/_/g, " ")} · {prep.session?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-3">
                  {prep.htfBias && (
                    <span className="text-xs font-medium" style={{ color: prep.htfBias === "LONG" ? "var(--color-long)" : prep.htfBias === "SHORT" ? "var(--color-short)" : "var(--color-text-muted)" }}>
                      {prep.htfBias}
                    </span>
                  )}
                  <GoNoGoBadge status={prep.goNoGoStatus} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

