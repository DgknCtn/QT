import Link from "next/link";
import { Plus, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AccountCard } from "./account-card";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const accounts = await prisma.fundedAccount.findMany({
    where:   { userId: user.id },
    include: { equityLogs: { orderBy: { date: "desc" }, take: 30 } },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Multi-account summary
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");
  const totalEquity    = activeAccounts.reduce((s, a) => s + a.currentEquity, 0);
  const totalStart     = activeAccounts.reduce((s, a) => s + a.startingBalance, 0);
  const totalProfit    = totalEquity - totalStart;
  const totalProfitPct = totalStart > 0 ? (totalProfit / totalStart) * 100 : 0;
  const todayPnlTotal  = activeAccounts.reduce((s, a) => {
    const log = a.equityLogs.find((l) => l.date >= today);
    return s + (log?.pnlToday ?? 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Funded Accounts</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {accounts.length} hesap · {activeAccounts.length} aktif
          </p>
        </div>
        <Link
          href="/accounts/new"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={14} /> Hesap Ekle
        </Link>
      </div>

      {/* Combined summary */}
      {activeAccounts.length > 1 && (
        <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--color-text-muted)" }}>
            Toplam Özet ({activeAccounts.length} aktif hesap)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Toplam Equity</p>
              <p className="text-xl font-black font-mono" style={{ color: "var(--color-text-primary)" }}>
                ${totalEquity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Toplam Kar/Zarar</p>
              <p className="text-xl font-black font-mono flex items-center gap-1"
                style={{ color: totalProfit >= 0 ? "#34c97e" : "#ef4444" }}>
                {totalProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {totalProfit >= 0 ? "+" : ""}${Math.abs(totalProfit).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: totalProfit >= 0 ? "#34c97e" : "#ef4444" }}>
                {totalProfitPct >= 0 ? "+" : ""}{totalProfitPct.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Bugünkü P&L</p>
              <p className="text-xl font-black font-mono"
                style={{ color: todayPnlTotal > 0 ? "#34c97e" : todayPnlTotal < 0 ? "#ef4444" : "var(--color-text-primary)" }}>
                {todayPnlTotal >= 0 ? "+" : ""}${Math.abs(todayPnlTotal).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Başlangıç Bakiye</p>
              <p className="text-xl font-black font-mono" style={{ color: "var(--color-text-secondary)" }}>
                ${totalStart.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {accounts.length === 0 && (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <Wallet size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz hesap eklenmedi</p>
          <Link
            href="/accounts/new"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            İlk hesabı ekle
          </Link>
        </div>
      )}

      {/* Account cards */}
      <div className="grid gap-4">
        {accounts.map((account) => {
          const todayLog = account.equityLogs.find((l) => l.date >= today);
          return (
            <AccountCard key={account.id} account={account} todayPnl={todayLog?.pnlToday ?? null} />
          );
        })}
      </div>
    </div>
  );
}
