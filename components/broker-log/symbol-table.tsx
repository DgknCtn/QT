import type { SymbolStat } from "@/lib/broker/stats";

/** Sembol bazlı performans — en çok kazandırandan en çok kaybettirene. */
export function SymbolTable({ stats }: { stats: SymbolStat[] }) {
  if (stats.length === 0) return null;

  const maxAbs = Math.max(...stats.map((s) => Math.abs(s.net)), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ color: "var(--color-text-muted)" }}>
            <th className="text-left px-3 py-2 font-normal">Sembol</th>
            <th className="text-right px-3 py-2 font-normal">İşlem</th>
            <th className="text-right px-3 py-2 font-normal">Kazanma</th>
            <th className="text-right px-3 py-2 font-normal">Fee</th>
            <th className="text-right px-3 py-2 font-normal">Net P&L</th>
            <th className="px-3 py-2 font-normal" style={{ width: 90 }} />
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const positive = s.net >= 0;
            const color = positive ? "var(--color-success)" : "var(--color-danger)";
            return (
              <tr key={s.instrument} className="border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                <td className="px-3 py-1.5 font-medium" style={{ color: "var(--color-text-primary)" }}>{s.instrument}</td>
                <td className="px-3 py-1.5 text-right" style={{ color: "var(--color-text-secondary)" }}>{s.count}</td>
                <td className="px-3 py-1.5 text-right" style={{ color: "var(--color-text-secondary)" }}>
                  %{Math.round((s.wins / s.count) * 100)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono" style={{ color: "var(--color-text-muted)" }}>
                  ${s.fees.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono font-semibold" style={{ color }}>
                  {positive ? "+" : ""}${s.net.toFixed(2)}
                </td>
                <td className="px-3 py-1.5">
                  {/* Ortadan iki yana büyüyen çubuk: kazandıran semboller sağa,
                      kaybettirenler sola uzanır, sıralamayla birlikte okunur. */}
                  <div className="relative h-1.5 rounded-full" style={{ background: "var(--color-bg-surface)" }}>
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        background: color,
                        width: `${(Math.abs(s.net) / maxAbs) * 50}%`,
                        left: positive ? "50%" : undefined,
                        right: positive ? undefined : "50%",
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
