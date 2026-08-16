import Link from "next/link";
import { Plus, ClipboardList, Trash2, Eye, Pencil, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { deleteDailyPrep } from "./actions";
import { GoNoGoBadge } from "@/components/ui-kit/badge";

// Map'ler Session/Bias enum'larıyla birebir. (Eskiden enum'da olmayan
// NEW_YORK/OVERNIGHT ve BULLISH/BEARISH anahtarları vardı, gerçek değerler ise
// hiç eşleşmiyordu.) GO/NO-GO için ortak ui-kit rozeti kullanılıyor.
const SESSION_LABEL: Record<string, string> = {
  LONDON: "London", NY_AM: "NY AM", NY_PM: "NY PM", ASIA: "Asia",
};
const BIAS_COLOR: Record<string, string> = {
  LONG: "#34c97e", SHORT: "#ef4444", WAIT: "#f59e0b", NEUTRAL: "#6b7280",
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
        <div className="flex items-center gap-2">
          {preps.length > 0 && (
            <Link href="/daily-prep/new?from=last"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium"
              style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-secondary)" }}>
              <Copy size={12} /> Son prep&apos;ten kopyala
            </Link>
          )}
          <Link href="/daily-prep/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            <Plus size={12} /> New Prep
          </Link>
        </div>
      </div>

      {preps.length === 0 ? (
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <ClipboardList size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz prep yok</p>
          <Link href="/daily-prep/new"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            İlk prep&apos;i oluştur
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
                const biasColor = BIAS_COLOR[prep.htfBias] ?? "var(--color-text-muted)";
                // completionScore zaten 0-100; ×100 yapılınca "8000%" görünüyordu.
                const pct = Math.round(prep.completionScore);
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
                      <GoNoGoBadge status={prep.goNoGoStatus} fallback="—" />
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
