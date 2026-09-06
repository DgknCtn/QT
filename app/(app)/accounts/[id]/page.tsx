import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { EquityLogForm } from "../equity-log-form";
import { EquityCurve } from "../equity-curve";

function fmt$(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const account = await prisma.fundedAccount.findFirst({
    where:   { id, userId: user.id },
    include: { equityLogs: { orderBy: { date: "asc" } } },
  });
  if (!account) notFound();

  const profit    = account.currentEquity - account.startingBalance;
  const profitPct = (profit / account.startingBalance) * 100;

  // Stats from logs
  const winDays  = account.equityLogs.filter((l) => (l.pnlToday ?? 0) > 0).length;
  const lossDays = account.equityLogs.filter((l) => (l.pnlToday ?? 0) < 0).length;
  const totalDays = winDays + lossDays;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href="/accounts" aria-label="Hesaplara dön" className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-bg-border)" }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {account.firmName} · Phase {account.phase}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {account.accountId ? `#${account.accountId} · ` : ""}Başlangıç: {fmtDate(account.startDate)}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Güncel Equity",  value: fmt$(account.currentEquity), sub: profit >= 0 ? `+${profitPct.toFixed(2)}%` : `${profitPct.toFixed(2)}%`, color: profit >= 0 ? "#34c97e" : "#ef4444" },
          { label: "Profit Hedefi",  value: fmt$(account.profitTarget),  sub: `${Math.min((Math.max(profit, 0) / account.profitTarget) * 100, 100).toFixed(0)}% tamamlandı`, color: "#6366f1" },
          { label: "Max Günlük Kayıp", value: fmt$(account.maxDailyLoss), sub: "günlük limit", color: "#f59e0b" },
          { label: "Max Toplam Kayıp", value: fmt$(account.maxTotalLoss), sub: "toplam limit", color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
            <p className="text-lg font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      {account.equityLogs.length > 1 && (
        <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Equity Eğrisi</p>
          <EquityCurve
            logs={account.equityLogs.map((l) => ({ date: l.date.toISOString().slice(0, 10), equity: l.equity }))}
            startingBalance={account.startingBalance}
          />
        </div>
      )}

      {/* Log Equity */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Günlük Equity Kaydet</p>
        <EquityLogForm accountId={account.id} currentEquity={account.currentEquity} />
      </div>

      {/* Log history */}
      {account.equityLogs.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-bg-border)" }}>
                {["Tarih", "Equity", "Günlük P&L", "Not"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...account.equityLogs].reverse().map((log, i) => (
                <tr key={log.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--color-bg-border)" }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{fmtDate(log.date)}</td>
                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>{fmt$(log.equity)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: log.pnlToday == null ? "var(--color-text-muted)" : (log.pnlToday ?? 0) >= 0 ? "#34c97e" : "#ef4444" }}>
                    {log.pnlToday != null ? `${(log.pnlToday ?? 0) >= 0 ? "+" : ""}${fmt$(log.pnlToday ?? 0)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{log.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalDays > 0 && (
            <div className="px-4 py-2.5 flex gap-4 text-xs" style={{ borderTop: "1px solid var(--color-bg-border)", color: "var(--color-text-muted)" }}>
              <span style={{ color: "#34c97e" }}>{winDays} kazançlı gün</span>
              <span style={{ color: "#ef4444" }}>{lossDays} kayıplı gün</span>
              <span>Win rate: {((winDays / totalDays) * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
