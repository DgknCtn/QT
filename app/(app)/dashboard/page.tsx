import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { economicEventScope } from "@/lib/economic-events";
import Link from "next/link";
import { format } from "date-fns";
import { tradingDayRange } from "@/lib/time/trading-day";
import {
  TrendingUp,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { MarketClockPanel } from "@/components/market-clock/market-clock-panel";
import { GoNoGoBadge } from "@/components/ui-kit/badge";
import { RiskGuardPanel } from "@/components/risk/risk-guard-panel";
import { computeGuardState } from "@/lib/risk/guard";
import { formatUsd } from "@/lib/money";
import { tracked, failed } from "@/lib/data-quality";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const greeting = getGreeting();

  const now = new Date();
  // Gun siniri piyasa gunune (ET) gore. `startOfDay` sunucunun saat dilimini
  // kullaniyordu: sunucu UTC'de, kullanici UTC+3'te, piyasa ET'de oldugu icin
  // ayni islem uc farkli "bugun"e dusebiliyordu.
  const { start: todayStart, end: todayEnd } = tradingDayRange(now);

  const [
    todayPrep,
    todayTrades,
    todayEvents,
    guardTrades,
    limits,
  ] = user
    ? await Promise.all([
        prisma.dailyPrep.findFirst({
          where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } },
          orderBy: { createdAt: "desc" },
        }).catch(() => null),
        prisma.trade.findMany({
          where: { userId: user.id, date: { gte: todayStart, lte: todayEnd }, result: { notIn: ["NO_TRADE", "MISSED"] } },
          select: { pnlCurrency: true },
        }).catch(() => []),
        prisma.economicEvent.findMany({
          where: { ...economicEventScope(user.id), dateTime: { gte: todayStart, lte: todayEnd } },
          orderBy: { dateTime: "asc" },
        }).catch(() => []),
        // Risk Guard gerçek broker P&L'ine bakar, manuel günlüğe değil:
        // durma kararı gerçekleşen zarara göre verilmeli.
        // Risk Guard'in verisi hata yutmadan geliyor: "islem yok" ile
        // "veri alinamadi" ayni sey degil ve ikincisinde panel guvenli
        // durum gostermemeli.
        tracked(
          prisma.brokerTrade.findMany({
            where: { userId: user.id, exitTime: { gte: todayStart, lte: todayEnd } },
            select: { entryTime: true, exitTime: true, netPnl: true },
          }),
          [] as { entryTime: Date; exitTime: Date; netPnl: number | null }[],
        ),
        prisma.user.findUnique({
          where: { id: user.id },
          select: { dailyLossLimitUsd: true, maxConsecutiveLosses: true },
        }).catch(() => null),
      ])
    : [null, [], [], failed<{ entryTime: Date; exitTime: Date; netPnl: number | null }[]>([]), null];

  // Risk panelinin kapsadigi son an. CSV ile beslenen veride son import'tan
  // sonraki islemler sistemde yok; kullanici neye baktigini bilmeli.
  const lastImported = user
    ? await prisma.brokerTrade
        .findFirst({
          where: { userId: user.id },
          orderBy: { exitTime: "desc" },
          select: { exitTime: true },
        })
        .catch(() => null)
    : null;

  const guardState = computeGuardState(
    guardTrades.value,
    {
      dailyLossLimitUsd: limits?.dailyLossLimitUsd ?? 0,
      maxConsecutiveLosses: limits?.maxConsecutiveLosses ?? 0,
    },
    now
  );

  const todayPnl = todayTrades.reduce((s, t) => s + (t.pnlCurrency ?? 0), 0);
  const hasTodayTrades = todayTrades.length > 0;

  const highRiskEvents = todayEvents.filter((e) => ["HIGH_RISK", "NO_TRADE_WINDOW"].includes(e.userRiskTag ?? "") || e.impact === "HIGH");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <RiskGuardPanel
        state={guardState}
        dataStatus={guardTrades.status}
        coveredUntil={lastImported?.exitTime ?? null}
      />

      {/* Header */}
      <div>
        <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
          {format(now, "EEEE, MMMM d, yyyy")}
        </p>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {greeting}, {user?.user_metadata?.name || user?.email?.split("@")[0] || "Trader"}
        </h2>
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

      {/* Row 1: Today's Prep · Today's Bias · Today's Events · Today's P&L */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Today's Prep */}
        <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs mb-2 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Today&apos;s Prep</p>
          <p className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {todayPrep ? (todayPrep.goNoGoStatus ?? "—") : "—"}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {todayPrep ? (todayPrep.htfBias ?? "No bias") : "Not started"}
          </p>
        </div>

        {/* Today's Bias */}
        <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Today&apos;s Bias</p>
            <TrendingUp size={14} style={{ color: "var(--color-text-muted)" }} />
          </div>
          {todayPrep ? (
            <>
              <p className="text-2xl font-bold mb-1" style={{ color: todayPrep.htfBias === "LONG" ? "var(--color-long)" : todayPrep.htfBias === "SHORT" ? "var(--color-short)" : "var(--color-text-muted)" }}>
                {todayPrep.htfBias ?? "NEUTRAL"}
              </p>
              <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
                {todayPrep.triad?.replace(/_/g, " ")} · {todayPrep.session?.replace(/_/g, " ")}
              </p>
              <div className="pt-2 border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                <GoNoGoBadge status={todayPrep.goNoGoStatus} />
              </div>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>—</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No daily prep yet</p>
            </>
          )}
        </div>

        {/* Today's Events */}
        <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Today&apos;s Events</p>
            <AlertTriangle size={14} style={{ color: "var(--color-text-muted)" }} />
          </div>
          {todayEvents.length === 0 ? (
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No events</p>
              <Link href="/calendar" className="text-xs" style={{ color: "var(--color-accent)" }}>Add →</Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todayEvents.slice(0, 3).map((ev) => {
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
              {todayEvents.length > 3 && (
                <Link href="/calendar" className="text-xs" style={{ color: "var(--color-accent)" }}>
                  +{todayEvents.length - 3} more →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Today's P&L */}
        <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Today&apos;s P&amp;L</p>
          <p className="text-2xl font-bold" style={{ color: hasTodayTrades ? (todayPnl > 0 ? "#34c97e" : todayPnl < 0 ? "#ef4444" : "var(--color-text-primary)") : "var(--color-text-muted)" }}>
            {hasTodayTrades ? formatUsd(todayPnl, { decimals: 0, signed: true }) : "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {hasTodayTrades ? `${todayTrades.length} trade` : "no trades today"}
          </p>
        </div>
      </div>

      {/* Market Clock Panel */}
      <MarketClockPanel />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

