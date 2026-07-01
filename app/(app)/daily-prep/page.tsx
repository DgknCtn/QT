import Link from "next/link";
import { Plus, ClipboardList, Trash2, Eye, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { deleteDailyPrep } from "./actions";

const SESSION_LABEL: Record<string, string> = {
  LONDON: "London", NEW_YORK: "New York", ASIA: "Asia", OVERNIGHT: "Overnight",
};
const BIAS_COLOR: Record<string, string> = {
  BULLISH: "#34c97e", BEARISH: "#ef4444", WAIT: "#f59e0b", NEUTRAL: "#6b7280",
};
const GONOGO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  GO:        { label: "Go",        color: "#34c97e", bg: "rgba(52,201,126,0.12)" },
  NO_GO:     { label: "No Go",     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  WAIT:      { label: "Bekle",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  REDUCED:   { label: "Azaltılmış", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

export default async function DailyPrepPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const preps = await prisma.dailyPrep.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      session: true,
      primaryInstrument: true,
      htfBias: true,
      goNoGoStatus: true,
      completionScore: true,
      isDraft: true,
    },
  });

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Daily Prep</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {preps.length} kayıt
          </p>
        </div>
        <Link href="/daily-prep/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}>
          <Plus size={12} /> New Prep
        </Link>
      </div>

      {preps.length === 0 ? (
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <ClipboardList size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz prep yok</p>
          <Link href="/daily-prep/new"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            İlk prep'i oluştur
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--color-bg-border)" }}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-bg-border)" }}>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Tarih</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Seans</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Enstrüman</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Bias</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Go/No-Go</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Tamamlanma</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {preps.map((prep, idx) => {
                const gonogo = prep.goNoGoStatus ? GONOGO_LABEL[prep.goNoGoStatus] : null;
                const biasColor = BIAS_COLOR[prep.htfBias] ?? "var(--color-text-muted)";
                const pct = Math.round(prep.completionScore * 100);
                return (
                  <tr key={prep.id}
                    style={{ borderTop: idx > 0 ? "1px solid var(--color-bg-border)" : undefined, background: "var(--color-bg-surface)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--color-text-primary)" }}>
                          {new Date(prep.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        {prep.isDraft && (
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}>Taslak</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {SESSION_LABEL[prep.session] ?? prep.session}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {prep.primaryInstrument}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold" style={{ color: biasColor }}>
                        {prep.htfBias}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {gonogo ? (
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ color: gonogo.color, background: gonogo.bg }}>
                          {gonogo.label}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: pct >= 80 ? "#34c97e" : pct >= 50 ? "#f59e0b" : "var(--color-accent)" }} />
                        </div>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/daily-prep/${prep.id}`}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          title="Görüntüle">
                          <Eye size={14} />
                        </Link>
                        <Link href={`/daily-prep/${prep.id}/edit`}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          title="Düzenle">
                          <Pencil size={14} />
                        </Link>
                        <form action={deleteDailyPrep.bind(null, prep.id)}>
                          <button type="submit"
                            className="p-1.5 rounded transition-colors hover:text-red-500"
                            style={{ color: "var(--color-text-muted)" }}
                            title="Sil">
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
