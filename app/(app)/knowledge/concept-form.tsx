"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveConcept } from "./actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Concept = {
  id: string;
  title: string;
  category: string;
  definition: string | null;
  whyItMatters: string | null;
  whenToUse: string | null;
  whenNotToUse: string | null;
  requiredConditions: string | null;
  commonMistakes: string | null;
  userNotes: string | null;
  confidenceLevel: string;
};

const CATEGORIES = [
  "QT_BASICS", "TRUE_OPENS", "SSMT_CORRELATION",
  "CONFIRMATION", "DFR", "BIAS_NARRATIVE", "RISK_EXECUTION",
];

const CONFIDENCE_LEVELS = ["NEW", "LEARNING", "PRACTICING", "COMFORTABLE", "MASTERED"];

export function ConceptForm({ concept }: { concept?: Concept }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const inputCls = "field-input";
  const labelCls = "step-label";
  const areaCls = "field-input";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const form = new FormData(formRef.current!);
    startTransition(async () => {
      try {
        const id = await saveConcept(form);
        router.push(`/knowledge/${id}`);
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-xs hover:underline" style={{ color: "var(--color-text-muted)" }}>
        <ArrowLeft size={12} /> Back to Knowledge Base
      </Link>

      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
          {concept ? "Edit Concept" : "New Concept Card"}
        </h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {concept && <input type="hidden" name="id" value={concept.id} />}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input type="text" name="title" defaultValue={concept?.title ?? ""} required placeholder="e.g. True Open, Silver Bullet, DFR" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select name="category" defaultValue={concept?.category ?? "QT_BASICS"} required className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Confidence Level</label>
              <select name="confidenceLevel" defaultValue={concept?.confidenceLevel ?? "NEW"} className={inputCls}>
                {CONFIDENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Definition</label>
            <textarea name="definition" defaultValue={concept?.definition ?? ""} rows={3} placeholder="What is it? One clear paragraph." className={areaCls} style={{ resize: "vertical" }} />
          </div>

          <div>
            <label className={labelCls}>Why It Matters</label>
            <textarea name="whyItMatters" defaultValue={concept?.whyItMatters ?? ""} rows={2} placeholder="Why does a QT trader care about this?" className={areaCls} style={{ resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>When to Use</label>
              <textarea name="whenToUse" defaultValue={concept?.whenToUse ?? ""} rows={3} className={areaCls} style={{ resize: "vertical" }} />
            </div>
            <div>
              <label className={labelCls}>When NOT to Use</label>
              <textarea name="whenNotToUse" defaultValue={concept?.whenNotToUse ?? ""} rows={3} className={areaCls} style={{ resize: "vertical" }} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Required Conditions</label>
            <textarea name="requiredConditions" defaultValue={concept?.requiredConditions ?? ""} rows={2} placeholder="What must be true before applying this concept?" className={areaCls} style={{ resize: "vertical" }} />
          </div>

          <div>
            <label className={labelCls}>Common Mistakes</label>
            <textarea name="commonMistakes" defaultValue={concept?.commonMistakes ?? ""} rows={2} placeholder="What do most people get wrong?" className={areaCls} style={{ resize: "vertical" }} />
          </div>

          <div>
            <label className={labelCls}>Personal Notes</label>
            <textarea name="userNotes" defaultValue={concept?.userNotes ?? ""} rows={3} placeholder="Your own observations, examples, edge cases…" className={areaCls} style={{ resize: "vertical" }} />
          </div>

          {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--color-accent)", color: "#fff", opacity: pending ? 0.6 : 1 }}
            >
              {pending ? "Saving…" : concept ? "Update Concept" : "Save Concept"}
            </button>
            <Link
              href={concept ? `/knowledge/${concept.id}` : "/knowledge"}
              className="px-4 py-2 rounded-lg text-sm text-center"
              style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
