import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";
import { ImportUploader } from "./import-uploader";
import { TradeRow } from "./trade-row";

export default async function TradeLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const trades = await prisma.brokerTrade.findMany({
    where: { userId: user.id },
    orderBy: { entryTime: "desc" },
  });

  const totalNet = trades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const decided = trades.filter((t) => t.netPnl != null);
  const wins = decided.filter((t) => (t.netPnl ?? 0) > 0).length;
  const winRate = decided.length > 0 ? Math.round((wins / decided.length) * 100) : null;

  const groups = new Map<string, typeof trades>();
  for (const t of trades) {
    const key = format(new Date(t.entryTime), "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Trade Log</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {trades.length} trade · {winRate != null ? `${winRate}% win rate` : "—"} ·{" "}
            <span style={{ color: totalNet >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {totalNet >= 0 ? "+" : ""}${totalNet.toFixed(2)}
            </span>
          </p>
        </div>
        <ImportUploader />
      </div>

      {trades.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <ClipboardList size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz trade içe aktarılmadı</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([day, dayTrades]) => {
            const dayNet = dayTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
            return (
              <div key={day} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
                <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--color-bg-surface)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    {format(new Date(day), "EEEE, d MMMM yyyy")} · {dayTrades.length} trade
                  </span>
                  <span className="text-xs font-mono font-semibold" style={{ color: dayNet >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                    {dayNet >= 0 ? "+" : ""}${dayNet.toFixed(2)}
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: "var(--color-text-muted)" }}>
                      <th className="text-left px-4 py-2">Saat</th>
                      <th className="text-left px-3 py-2">Sembol</th>
                      <th className="text-left px-3 py-2">Yön</th>
                      <th className="text-right px-3 py-2">Adet</th>
                      <th className="text-right px-3 py-2">Giriş</th>
                      <th className="text-right px-3 py-2">Çıkış</th>
                      <th className="text-right px-3 py-2">Net P&L</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {dayTrades.map((t) => (
                      <TradeRow key={t.id} trade={t} />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
