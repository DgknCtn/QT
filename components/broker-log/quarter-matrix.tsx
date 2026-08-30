import { SESSION_ORDER, QUARTER_ORDER, type CellStat } from "@/lib/broker/stats";

/**
 * Seans × 90dk çeyrek ızgarası — sayfanın asıl sorusu:
 * "günün hangi diliminde para kazanıyorum?"
 *
 * Renk yoğunluğu net P&L'in o ızgaradaki en büyük mutlak değere oranı;
 * böylece kâr/zarar dağılımı tek bakışta okunuyor. `pnl-heatmap.tsx`
 * ile aynı yaklaşım.
 */
export function QuarterMatrix({
  cells,
  maxAbs,
}: {
  cells: Map<string, CellStat>;
  maxAbs: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ minWidth: 420 }}>
        <thead>
          <tr style={{ color: "var(--color-text-muted)" }}>
            <th className="text-left px-3 py-2 font-normal">Seans</th>
            {QUARTER_ORDER.map((q) => (
              <th key={q} className="text-center px-3 py-2 font-normal">{q}</th>
            ))}
            <th className="text-right px-3 py-2 font-normal">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {SESSION_ORDER.map(({ key, label }) => {
            const rowCells = QUARTER_ORDER.map((q) => cells.get(`${key}|${q}`));
            const rowNet = rowCells.reduce((s, c) => s + (c?.net ?? 0), 0);
            const rowCount = rowCells.reduce((s, c) => s + (c?.count ?? 0), 0);

            return (
              <tr key={key} className="border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: "var(--color-text-primary)" }}>
                  {label}
                </td>

                {QUARTER_ORDER.map((q, i) => {
                  const c = rowCells[i];
                  if (!c || c.count === 0) {
                    return (
                      <td key={q} className="px-3 py-2 text-center" style={{ color: "var(--color-text-muted)" }}>
                        —
                      </td>
                    );
                  }
                  const intensity = maxAbs > 0 ? Math.min(Math.abs(c.net) / maxAbs, 1) : 0;
                  const positive = c.net >= 0;
                  return (
                    <td key={q} className="px-1 py-1 text-center">
                      <div
                        className="rounded-md px-2 py-1.5"
                        style={{
                          background: positive
                            ? `rgba(34,197,94,${0.08 + intensity * 0.34})`
                            : `rgba(239,68,68,${0.08 + intensity * 0.34})`,
                        }}
                        title={`${c.count} pozisyon · ${c.wins} kazanan`}
                      >
                        <div
                          className="font-mono font-semibold"
                          style={{ color: positive ? "var(--color-success)" : "var(--color-danger)" }}
                        >
                          {positive ? "+" : ""}{c.net.toFixed(0)}
                        </div>
                        <div style={{ color: "var(--color-text-muted)", fontSize: 10 }}>
                          {c.count} işlem · %{Math.round((c.wins / c.count) * 100)}
                        </div>
                      </div>
                    </td>
                  );
                })}

                <td
                  className="px-3 py-2 text-right font-mono font-semibold whitespace-nowrap"
                  style={{ color: rowCount === 0 ? "var(--color-text-muted)" : rowNet >= 0 ? "var(--color-success)" : "var(--color-danger)" }}
                >
                  {rowCount === 0 ? "—" : `${rowNet >= 0 ? "+" : ""}$${rowNet.toFixed(0)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
