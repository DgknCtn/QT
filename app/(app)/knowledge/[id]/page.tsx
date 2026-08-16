import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { MyNotes } from "../my-notes";

const CONFIDENCE_LEVELS = ["NEW", "LEARNING", "PRACTICING", "COMFORTABLE", "MASTERED"] as const;
type ConfLevel = typeof CONFIDENCE_LEVELS[number];

const confColor: Record<ConfLevel, string> = {
  NEW:         "var(--color-text-muted)",
  LEARNING:    "var(--color-danger)",
  PRACTICING:  "var(--color-warning)",
  COMFORTABLE: "var(--color-accent)",
  MASTERED:    "var(--color-success)",
};

export default async function ConceptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await requireUserId();

  const concept = await prisma.concept.findUnique({
    where: { id },
    include: { progress: { where: { userId }, take: 1 } },
  });
  if (!concept) notFound();

  // Learning state is per-user; an untouched concept reads as NEW.
  const confidenceLevel = concept.progress[0]?.confidenceLevel ?? "NEW";
  const userNotes = concept.progress[0]?.userNotes ?? null;

  const idx = CONFIDENCE_LEVELS.indexOf(confidenceLevel as ConfLevel);
  const color = confColor[confidenceLevel as ConfLevel] ?? "var(--color-text-muted)";

  const sections: { label: string; value: string | null }[] = [
    { label: "Definition", value: concept.definition },
    { label: "Why It Matters", value: concept.whyItMatters },
    { label: "When to Use", value: concept.whenToUse },
    { label: "When NOT to Use", value: concept.whenNotToUse },
    { label: "Required Conditions", value: concept.requiredConditions },
    { label: "Common Mistakes", value: concept.commonMistakes },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-xs hover:underline" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={12} /> Knowledge Base
        </Link>
        <Link href={`/knowledge/${id}/edit`} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
          style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-border)" }}>
          <Pencil size={11} /> Edit
        </Link>
      </div>

      {/* Header card */}
      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs px-1.5 py-0.5 rounded mb-2 inline-block" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>
              {concept.category.replace(/_/g, " ")}
            </span>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{concept.title}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color }}>
              {confidenceLevel}
            </p>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
              <div className="h-full rounded-full" style={{ width: `${((idx + 1) / CONFIDENCE_LEVELS.length) * 100}%`, background: color }} />
            </div>
          </div>
        </div>
      </div>

      {/* Per-user notes (editable by anyone signed in) */}
      <MyNotes conceptId={id} initialNotes={userNotes} />

      {/* Content sections */}
      {sections.filter((s) => s.value).map(({ label, value }) => (
        <div key={label} className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>{label}</h3>
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              color: label === "Personal Notes" ? "var(--color-accent)" : label === "Common Mistakes" ? "var(--color-danger)" : "var(--color-text-secondary)",
            }}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
