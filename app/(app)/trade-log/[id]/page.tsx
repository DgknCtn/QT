import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { TradeDetailForm } from "./trade-detail-form";

export default async function BrokerTradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const trade = await prisma.brokerTrade.findFirst({ where: { id, userId: user.id } });
  if (!trade) notFound();

  const netPnl = trade.netPnl ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/trade-log" className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {format(new Date(trade.entryTime), "EEEE, MMMM d, yyyy")}
          </p>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {trade.instrument} · {trade.direction}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Net P&L</p>
            <p className="text-3xl font-black" style={{ color: netPnl >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}
            </p>
          </div>
          <div className="text-right text-xs" style={{ color: "var(--color-text-muted)" }}>
            <p>{format(new Date(trade.entryTime), "HH:mm:ss")} → {format(new Date(trade.exitTime), "HH:mm:ss")}</p>
            <p>{trade.account ?? "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p style={{ color: "var(--color-text-muted)" }}>Adet</p>
            <p className="font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>{trade.quantity}</p>
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)" }}>Giriş</p>
            <p className="font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>{trade.entryPrice}</p>
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)" }}>Çıkış</p>
            <p className="font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>{trade.exitPrice}</p>
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)" }}>Komisyon/Fee</p>
            <p className="font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>
              ${((trade.commission ?? 0) + (trade.fees ?? 0)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <TradeDetailForm
        tradeId={trade.id}
        netPnl={netPnl}
        riskUsd={trade.riskUsd}
        journalNote={trade.journalNote}
        chartUrl={trade.chartUrl}
      />
    </div>
  );
}
