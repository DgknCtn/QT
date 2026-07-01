import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil } from "lucide-react";
import { deletePlaybook } from "../actions";

const CAT_COLORS: Record<string, string> = {
  REVERSAL:    "#ef4444",
  SSMT:        "#6366f1",
  DFR:         "#f59e0b",
  TRUE_OPEN:   "#34c97e",
  CONTINUATION:"#3b82f6",
  EXPANSION:   "#a78bfa",
  CUSTOM:      "#6b7280",
};

const SECTIONS = [
  { key: "conditions"   as const, label: "Giriş Koşulları",  color: "#34c97e" },
  { key: "management"   as const, label: "Trade Yönetimi",   color: "#6366f1" },
  { key: "invalidation" as const, label: "İptal Koşulları",  color: "#ef4444" },
];

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entry = await prisma.playbookEntry.findFirst({ where: { id, userId: user.id } });
  if (!entry) notFound();

  const color = CAT_COLORS[entry.category] ?? "#6b7280";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link href="/playbook" className="inline-flex items-center gap-1.5 text-xs hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={12} /> Playbook&apos;a Dön
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/playbook/${entry.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)", background: "var(--color-bg-elevated)" }}>
            <Pencil size={11} /> Düzenle
          </Link>
          <form action={deletePlaybook.bind(null, entry.id)}>
            <button type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: "var(--color-bg-border)", color: "#ef4444", background: "var(--color-bg-elevated)" }}
              onClick={(e) => { if (!confirm("Bu setup silinsin mi?")) e.preventDefault(); }}>
              Sil
            </button>
          </form>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold mb-2"
              style={{ background: `${color}20`, color }}>
              {entry.category}
            </span>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{entry.title}</h1>
            {entry.description && (
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{entry.description}</p>
            )}
          </div>
          <span className="text-xs px-2 py-0.5 rounded shrink-0"
            style={{
              background: entry.isActive ? "rgba(52,201,126,0.12)" : "rgba(107,114,128,0.12)",
              color: entry.isActive ? "#34c97e" : "#6b7280",
            }}>
            {entry.isActive ? "Aktif" : "Pasif"}
          </span>
        </div>
      </div>

      {/* Rule sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SECTIONS.map(({ key, label, color: sColor }) => {
          const rules = entry[key].filter(Boolean);
          return (
            <div key={key} className="rounded-xl border p-4 space-y-3"
              style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: sColor }}>{label}</h3>
              {rules.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</p>
              ) : (
                <ul className="space-y-2">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background: `${sColor}20`, color: sColor }}>
                        {i + 1}
                      </span>
                      <span style={{ color: "var(--color-text-secondary)" }}>{rule}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {entry.notes && (
        <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Notlar</h3>
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{entry.notes}</p>
        </div>
      )}

      {/* Screenshots */}
      {entry.imageUrls.length > 0 && (
        <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Örnek Görseller</h3>
          <div className="grid grid-cols-2 gap-3">
            {entry.imageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative block w-full rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <Image src={url} alt={`Screenshot ${i + 1}`} fill className="object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
