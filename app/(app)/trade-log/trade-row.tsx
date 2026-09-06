"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Link2, Link2Off } from "lucide-react";
import { DeleteBrokerTradeButton } from "./delete-button";
import { formatUsd } from "@/lib/money";

type Row = {
  id: string;
  entryTime: Date;
  instrument: string;
  direction: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  netPnl: number | null;
  session?: string | null;
  quarter90?: string | null;
  /** Bagli journal kaydinin id'si; yoksa pozisyon plansiz gerceklesmis. */
  tradeId?: string | null;
};

/** `showQuarter` yalnızca QT çeyreği doldurulan kaynaklarda (Binance) anlamlı. */
export function TradeRow({ trade, showQuarter = false }: { trade: Row; showQuarter?: boolean }) {
  const router = useRouter();

  return (
    <tr
      className="border-t cursor-pointer transition-colors hover:brightness-110"
      style={{ borderColor: "var(--color-bg-border)" }}
      onClick={() => router.push(`/trade-log/${trade.id}`)}
    >
      <td className="px-4 py-2 font-mono" style={{ color: "var(--color-text-muted)" }}>
        {format(new Date(trade.entryTime), "HH:mm")}
      </td>
      <td className="px-3 py-2 font-medium" style={{ color: "var(--color-text-primary)" }}>
        {trade.instrument}
        {/* Plana bagli mi: eslesmemis pozisyonlar bir bakista gorunsun,
            cunku analiz ancak baglanmis olanlar uzerinden anlam tasiyor. */}
        {trade.tradeId ? (
          <Link2 size={12} className="inline ml-1.5 align-middle" style={{ color: "var(--color-success)" }} aria-label="journal kaydına bağlı" />
        ) : (
          <Link2Off size={12} className="inline ml-1.5 align-middle" style={{ color: "var(--color-text-muted)" }} aria-label="journal kaydına bağlı değil" />
        )}
      </td>
      <td className="px-3 py-2" style={{ color: trade.direction === "LONG" ? "var(--color-long)" : "var(--color-short)" }}>{trade.direction}</td>
      {showQuarter && (
        <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
          {trade.session ? `${trade.session.replace("_", " ")} · ${trade.quarter90 ?? ""}` : "—"}
        </td>
      )}
      <td className="px-3 py-2 text-right" style={{ color: "var(--color-text-secondary)" }}>{trade.quantity}</td>
      <td className="px-3 py-2 text-right font-mono" style={{ color: "var(--color-text-secondary)" }}>{trade.entryPrice}</td>
      <td className="px-3 py-2 text-right font-mono" style={{ color: "var(--color-text-secondary)" }}>{trade.exitPrice}</td>
      <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: trade.netPnl == null ? "var(--color-text-muted)" : trade.netPnl >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
        {formatUsd(trade.netPnl, { signed: true })}
      </td>
      <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteBrokerTradeButton id={trade.id} />
      </td>
    </tr>
  );
}
