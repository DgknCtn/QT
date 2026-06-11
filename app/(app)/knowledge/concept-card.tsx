"use client";

import Link from "next/link";
import { updateConfidence } from "./actions";
import { useTransition } from "react";

type Concept = {
  id: string;
  title: string;
  category: string;
  definition: string | null;
  confidenceLevel: string;
  isSystemConcept: boolean;
};

const CONFIDENCE_LEVELS = ["NEW", "LEARNING", "PRACTICING", "COMFORTABLE", "MASTERED"] as const;
type ConfLevel = typeof CONFIDENCE_LEVELS[number];

const confColor: Record<ConfLevel, string> = {
  NEW:         "var(--color-text-muted)",
  LEARNING:    "var(--color-danger)",
  PRACTICING:  "var(--color-warning)",
  COMFORTABLE: "var(--color-accent)",
  MASTERED:    "var(--color-success)",
};

const catColor: Record<string, string> = {
  QT_BASICS:          "var(--color-accent)",
  TRUE_OPENS:         "#8b5cf6",
  SSMT_CORRELATION:   "#f59e0b",
  CONFIRMATION:       "#10b981",
  DFR:                "#ef4444",
  BIAS_NARRATIVE:     "#3b82f6",
  RISK_EXECUTION:     "#6366f1",
};

export function ConceptCard({ concept }: { concept: Concept }) {
  const [pending, startTransition] = useTransition();
  const currentIdx = CONFIDENCE_LEVELS.indexOf(concept.confidenceLevel as ConfLevel);

  function cycleConfidence() {
    const next = CONFIDENCE_LEVELS[(currentIdx + 1) % CONFIDENCE_LEVELS.length];
    startTransition(() => updateConfidence(concept.id, next));
  }

  const color = confColor[concept.confidenceLevel as ConfLevel] ?? "var(--color-text-muted)";
  const catCol = catColor[concept.category] ?? "var(--color-accent)";

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2 hover:border-opacity-80 transition-colors"
      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded mb-1 inline-block"
            style={{ background: `${catCol}22`, color: catCol }}
          >
            {concept.category.replace(/_/g, " ")}
          </span>
          <Link
            href={`/knowledge/${concept.id}`}
            className="block text-sm font-semibold hover:underline"
            style={{ color: "var(--color-text-primary)" }}
          >
            {concept.title}
          </Link>
        </div>
        <button
          onClick={cycleConfidence}
          disabled={pending}
          title="Click to advance confidence level"
          className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded border transition-opacity"
          style={{
            color,
            borderColor: color,
            background: `${color}18`,
            opacity: pending ? 0.5 : 1,
          }}
        >
          {concept.confidenceLevel}
        </button>
      </div>
      {concept.definition && (
        <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{concept.definition}</p>
      )}
      {/* Confidence bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${((currentIdx + 1) / CONFIDENCE_LEVELS.length) * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
