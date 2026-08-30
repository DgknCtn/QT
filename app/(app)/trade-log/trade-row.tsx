"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DeleteBrokerTradeButton } from "./delete-button";

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
      <td className="px-3 py-2 font-medium" style={{ color: "var(--color-text-primary)" }}>{trade.instrument}</td>
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
        {trade.netPnl == null ? "—" : `${trade.netPnl >= 0 ? "+" : ""}$${trade.netPnl.toFixed(2)}`}
      </td>
      <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteBrokerTradeButton id={trade.id} />
      </td>
    </tr>
  );
}
