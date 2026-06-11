import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
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

  // Get today's P&L from the most recent equity log for each account
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Funded Accounts</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {accounts.length} hesap · {accounts.filter((a) => a.status === "ACTIVE").length} aktif
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
