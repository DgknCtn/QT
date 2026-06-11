"use client";

import { useState } from "react";
import { ConceptCard } from "./concept-card";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

type Concept = {
  id: string;
  title: string;
  category: string;
  definition: string | null;
  confidenceLevel: string;
  isSystemConcept: boolean;
};

const CATEGORIES = [
  "ALL", "QT_BASICS", "TRUE_OPENS", "SSMT_CORRELATION",
  "CONFIRMATION", "DFR", "BIAS_NARRATIVE", "RISK_EXECUTION",
];

export function KnowledgeShell({ concepts }: { concepts: Concept[] }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("ALL");

  const filtered = concepts.filter((c) => {
    const matchCat = cat === "ALL" || c.category === cat;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.definition?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const masteredCount = concepts.filter((c) => c.confidenceLevel === "MASTERED").length;
  const learningCount = concepts.filter((c) => ["NEW", "LEARNING"].includes(c.confidenceLevel)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Total</p>
            <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{concepts.length}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Mastered</p>
            <p className="text-xl font-bold" style={{ color: "var(--color-success)" }}>{masteredCount}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Still learning</p>
            <p className="text-xl font-bold" style={{ color: "var(--color-warning)" }}>{learningCount}</p>
          </div>
        </div>
        <Link
          href="/knowledge/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={12} /> New Concept
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Search concepts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-8"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
              style={{
                background: cat === c ? "var(--color-accent)" : "var(--color-bg-elevated)",
                color: cat === c ? "#fff" : "var(--color-text-muted)",
                borderColor: cat === c ? "var(--color-accent)" : "var(--color-bg-border)",
              }}
            >
              {c.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-12 gap-2"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {search || cat !== "ALL" ? "No concepts match your filter." : "No concepts yet."}
          </p>
          {!search && cat === "ALL" && (
            <Link href="/knowledge/new" className="text-xs" style={{ color: "var(--color-accent)" }}>
              Add your first concept card →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => <ConceptCard key={c.id} concept={c} />)}
        </div>
      )}
    </div>
  );
}
