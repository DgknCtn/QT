import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, BookMarked, Circle, CheckCircle2 } from "lucide-react";

const CAT_COLORS: Record<string, string> = {
  REVERSAL:    "#ef4444",
  SSMT:        "#6366f1",
  DFR:         "#f59e0b",
  TRUE_OPEN:   "#34c97e",
  CONTINUATION:"#3b82f6",
  EXPANSION:   "#a78bfa",
  CUSTOM:      "#6b7280",
};

function catColor(cat: string) {
  return CAT_COLORS[cat] ?? "#6b7280";
}

export default async function PlaybookPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await prisma.playbookEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const categories = [...new Set(entries.map((e) => e.category))].sort();
  const filtered = cat ? entries.filter((e) => e.category === cat) : entries;

  return (
    <div className="p-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Playbook</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {entries.length} setup · {entries.filter((e) => e.isActive).length} aktif
          </p>
        </div>
        <Link href="/playbook/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}>
          <Plus size={12} /> Yeni Setup
        </Link>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link href="/playbook"
            className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
            style={{
              background: !cat ? "var(--color-accent)" : "var(--color-bg-surface)",
              borderColor: !cat ? "var(--color-accent)" : "var(--color-bg-border)",
              color: !cat ? "#fff" : "var(--color-text-muted)",
            }}>
            Tümü ({entries.length})
          </Link>
          {categories.map((c) => {
            const active = cat === c;
            const count = entries.filter((e) => e.category === c).length;
            const color = catColor(c);
            return (
              <Link key={c} href={`/playbook?cat=${c}`}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                style={{
                  background: active ? `${color}22` : "var(--color-bg-surface)",
                  borderColor: active ? color : "var(--color-bg-border)",
                  color: active ? color : "var(--color-text-muted)",
                }}>
                {c} ({count})
              </Link>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <BookMarked size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz playbook entry yok</p>
          <Link href="/playbook/new"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            İlk setup&apos;u oluştur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => {
            const color = catColor(entry.category);
            return (
              <Link key={entry.id} href={`/playbook/${entry.id}`}
                className="rounded-xl border p-4 space-y-3 block transition-opacity"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-bg-border)",
                  opacity: entry.isActive ? 1 : 0.5,
                }}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-bold mb-1"
                      style={{ background: `${color}20`, color }}>
                      {entry.category}
                    </span>
                    <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                      {entry.title}
                    </h3>
                  </div>
                  {entry.isActive
                    ? <CheckCircle2 size={14} style={{ color: "#34c97e", flexShrink: 0 }} />
                    : <Circle size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  }
                </div>

                {entry.description && (
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                    {entry.description}
                  </p>
                )}

                {/* Rule counts */}
                <div className="flex gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span style={{ color: "#34c97e" }}>{entry.conditions.filter(Boolean).length} koşul</span>
                  <span style={{ color: "#6366f1" }}>{entry.management.filter(Boolean).length} yönetim</span>
                  <span style={{ color: "#ef4444" }}>{entry.invalidation.filter(Boolean).length} iptal</span>
                </div>

                {entry.imageUrls.length > 0 && (
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    📎 {entry.imageUrls.length} görsel
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
