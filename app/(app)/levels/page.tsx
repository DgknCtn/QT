import Link from "next/link";
import { Plus, Layers, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DeleteLevelButton, ToggleStatusButton } from "./level-actions-client";
import type { LevelStatus } from "@prisma/client";

const TYPE_LABELS: Record<string, string> = {
  TYO: "TYO", TMO: "TMO", TWO: "TWO", TDO: "TDO", TSO: "TSO", TMSO: "TMSO",
  PREV_HIGH: "Prev High", PREV_LOW: "Prev Low",
  EQUAL_HIGHS: "Equal Highs", EQUAL_LOWS: "Equal Lows",
  DFR_HIGH: "DFR High", DFR_LOW: "DFR Low", DFR_MID: "DFR Mid", DFR_PROJECTION: "DFR Proj",
  FVG: "FVG", OB: "OB", NWOG: "NWOG", NDOG: "NDOG",
  CUSTOM_POI: "Custom POI", CUSTOM_TOI: "Custom TOI",
};

const TF_ORDER = ["MONTHLY","WEEKLY","DAILY","H4","H1","M90","M15","M5","M1","S15","CUSTOM"];

function statusDot(status: LevelStatus) {
  const colors: Record<LevelStatus, string> = {
    ACTIVE: "#34c97e", INACTIVE: "#5a5a6a", REACHED: "#f59e0b",
  };
  return colors[status] ?? "#5a5a6a";
}

export default async function LevelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const levels = await prisma.level.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { timeframe: "asc" }, { price: "desc" }],
  });

  // Group by marketGroup + sort by TF order within each group
  const groups = levels.reduce<Record<string, typeof levels>>((acc, l) => {
    const key = l.marketGroup;
    acc[key] = acc[key] ?? [];
    acc[key].push(l);
    return acc;
  }, {});

  const activeCount   = levels.filter((l) => l.status === "ACTIVE").length;
  const reachedCount  = levels.filter((l) => l.status === "REACHED").length;
  const inactiveCount = levels.filter((l) => l.status === "INACTIVE").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Price Levels</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {levels.length} level · {activeCount} aktif · {reachedCount} reached · {inactiveCount} inactive
          </p>
        </div>
        <Link
          href="/levels/new"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={14} /> Level Ekle
        </Link>
      </div>

      {levels.length === 0 && (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <Layers size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz level kaydedilmedi</p>
          <Link
            href="/levels/new"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            İlk leveli ekle
          </Link>
        </div>
      )}

      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            {group}
          </p>
          <div
            className="rounded-xl border overflow-x-auto"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
          >
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-bg-border)" }}>
                  {["Durum","Enstrüman","Tip","Timeframe","Fiyat","Geçerlilik","Notlar",""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((l, i) => (
                  <tr
                    key={l.id}
                    style={{
                      borderTop: i === 0 ? undefined : "1px solid var(--color-bg-border)",
                      opacity: l.status === "INACTIVE" ? 0.5 : 1,
                    }}
                  >
                    {/* Status dot */}
                    <td className="px-4 py-3">
                      <Circle size={8} fill={statusDot(l.status)} stroke="none" />
                    </td>
                    {/* Instrument */}
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>
                      {l.instrument}
                    </td>
                    {/* Type badge */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{ background: "var(--color-bg-surface)", color: "var(--color-accent)" }}
                      >
                        {TYPE_LABELS[l.levelType] ?? l.levelType}
                      </span>
                    </td>
                    {/* Timeframe */}
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
                      {l.timeframe}
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {l.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                    {/* Validity */}
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {l.dateValidFrom || l.dateValidTo
                        ? `${l.dateValidFrom ? l.dateValidFrom.toLocaleDateString("tr-TR", { day:"2-digit", month:"short" }) : "–"} → ${l.dateValidTo ? l.dateValidTo.toLocaleDateString("tr-TR", { day:"2-digit", month:"short" }) : "∞"}`
                        : "—"}
                    </td>
                    {/* Notes */}
                    <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "var(--color-text-muted)" }} title={l.notes ?? undefined}>
                      {l.notes ?? "—"}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ToggleStatusButton levelId={l.id} status={l.status} />
                        <Link
                          href={`/levels/${l.id}/edit`}
                          className="px-2 py-1 rounded text-xs"
                          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-border)" }}
                        >
                          Düzenle
                        </Link>
                        <DeleteLevelButton levelId={l.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
