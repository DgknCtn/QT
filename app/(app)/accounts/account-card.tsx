"use client";

import Link from "next/link";
import { useTransition } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { deleteAccount } from "./actions";
import type { FundedAccount, EquityLog } from "@prisma/client";

interface Props {
  account: FundedAccount & { equityLogs: EquityLog[] };
  todayPnl: number | null;
}

function ProgressBar({ value, max, color, danger = false }: { value: number; max: number; color: string; danger?: boolean }) {
  const pct = Math.min(max > 0 ? (value / max) * 100 : 0, 100);
  // For danger bars (loss/drawdown): red at 90%, amber at 70%
  // For target bars (profit): keep original color, green at 100%
  const bg = danger
    ? (pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : color)
    : (pct >= 100 ? "#34c97e" : color);
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bg }} />
    </div>
  );
}

export function AccountCard({ account, todayPnl }: Props) {
  const [pending, startTransition] = useTransition();

  const profit   = account.currentEquity - account.startingBalance;
  const profitPct = (profit / account.startingBalance) * 100;
  const drawdown  = Math.min(profit, 0); // negative = drawdown
  const drawdownAbs = Math.abs(Math.min(drawdown, 0));

  const todayLoss = todayPnl !== null && todayPnl < 0 ? Math.abs(todayPnl) : 0;

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "#34c97e", PASSED: "#6366f1", FAILED: "#ef4444", REVIEW: "#f59e0b",
  };
  const statusColor = STATUS_COLORS[account.status] ?? "#5a5a6a";

  // Warn at 70% of daily limit, 70% of total drawdown limit
  const dailyUsedPct  = account.maxDailyLoss  > 0 ? todayLoss    / account.maxDailyLoss  : 0;
  const totalUsedPct  = account.maxTotalLoss   > 0 ? drawdownAbs  / account.maxTotalLoss  : 0;
  const isWarning     = dailyUsedPct >= 0.7 || totalUsedPct >= 0.7;
  const isAtRisk      = dailyUsedPct >= 0.9 || totalUsedPct >= 0.9;

  return (
    <div
      className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
      style={{
        background: "var(--color-bg-elevated)",
        borderColor: isAtRisk ? "#ef4444" : isWarning ? "#f59e0b" : "var(--color-bg-border)",
        boxShadow: isAtRisk ? "0 0 0 1px #ef4444" : isWarning ? "0 0 0 1px #f59e0b" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${statusColor}22`, color: statusColor }}>
              {account.status}
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              Phase {account.phase}
            </span>
            {account.accountId && (
              <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>#{account.accountId}</span>
            )}
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{account.firmName}</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>
            ${account.currentEquity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm flex items-center justify-end gap-1 mt-0.5" style={{ color: profit >= 0 ? "#34c97e" : "#ef4444" }}>
            {profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {profit >= 0 ? "+" : ""}{profit.toFixed(2)} ({profitPct >= 0 ? "+" : ""}{profitPct.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Risk meters */}
      <div className="space-y-3">
        {/* Profit Target */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            <span>Profit Hedefi</span>
            <span style={{ color: profit >= account.profitTarget ? "#34c97e" : "var(--color-text-secondary)" }}>
              {profit >= 0 ? "+" : ""}${profit.toFixed(0)} / ${account.profitTarget.toFixed(0)}
              {profit >= account.profitTarget && " ✓"}
            </span>
          </div>
          <ProgressBar value={Math.max(profit, 0)} max={account.profitTarget} color="#34c97e" />
        </div>

        {/* Daily Loss */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            <span>Bugünkü Kayıp</span>
            <span style={{ color: todayLoss >= account.maxDailyLoss * 0.8 ? "#ef4444" : "var(--color-text-secondary)" }}>
              ${todayLoss.toFixed(0)} / ${account.maxDailyLoss.toFixed(0)} limitten
            </span>
          </div>
          <ProgressBar value={todayLoss} max={account.maxDailyLoss} color="#f59e0b" danger />
        </div>

        {/* Max Drawdown */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            <span>Toplam Drawdown</span>
            <span style={{ color: totalUsedPct >= 0.7 ? "#ef4444" : "var(--color-text-secondary)" }}>
              ${drawdownAbs.toFixed(0)} / ${account.maxTotalLoss.toFixed(0)} limitten
            </span>
          </div>
          <ProgressBar value={drawdownAbs} max={account.maxTotalLoss} color="#6366f1" danger />
        </div>
      </div>

      {/* Warning */}
      {isAtRisk && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#ef444420", color: "#ef4444" }}>
          <AlertTriangle size={14} />
          Limit sınırına çok yakın (%90) — bugün işlem yapma!
        </div>
      )}
      {!isAtRisk && isWarning && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
          <AlertTriangle size={14} />
          Risk limitinin %70'ine ulaşıldı — dikkatli ol.
        </div>
      )}
      {profit >= account.profitTarget && account.status === "ACTIVE" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#34c97e20", color: "#34c97e" }}>
          <CheckCircle size={14} />
          Profit hedefine ulaşıldı! Phase geçişi için hazır.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/accounts/${account.id}`}
          className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Detay & Equity Log
        </Link>
        <Link
          href={`/accounts/${account.id}/edit`}
          className="px-3 py-1.5 rounded-lg text-xs"
          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-border)" }}
        >
          Düzenle
        </Link>
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm("Bu hesap silinsin mi? Tüm equity logları da silinir.")) return;
            startTransition(() => deleteAccount(account.id));
          }}
          className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
          style={{ background: "var(--color-bg-surface)", color: "#ef4444", border: "1px solid var(--color-bg-border)" }}
        >
          {pending ? "…" : "Sil"}
        </button>
      </div>
    </div>
  );
}
