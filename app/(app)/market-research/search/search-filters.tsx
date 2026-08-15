"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";

const INSTRUMENTS = ["NQ", "ES", "YM"] as const;
const ANALYSIS_TYPES = [
  { value: "PRE_MARKET", label: "Pre-Market" },
  { value: "INTRADAY", label: "Intraday" },
  { value: "EOD", label: "EOD" },
  { value: "EOW", label: "EOW" },
] as const;

export function SearchFilters({
  initialValues,
}: {
  initialValues: { q?: string; dateFrom?: string; dateTo?: string; instrument?: string; analysisType?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialValues.q ?? "");
  const [instrument, setInstrument] = useState(initialValues.instrument ?? "");
  const [analysisType, setAnalysisType] = useState(initialValues.analysisType ?? "");

  function applyAll(next: Partial<{ q: string; instrument: string; analysisType: string }>) {
    const params = new URLSearchParams();
    const merged = { q, instrument, analysisType, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.instrument) params.set("instrument", merged.instrument);
    if (merged.analysisType) params.set("analysisType", merged.analysisType);
    router.push(`/market-research/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyAll({});
      }}
      className="space-y-2"
    >
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="örn. liquidity, ssmt, PDL..."
          className="w-full text-sm rounded-lg border pl-9 pr-3 py-2"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)", color: "var(--color-text-primary)" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {INSTRUMENTS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const next = instrument === i ? "" : i;
                setInstrument(next);
                applyAll({ instrument: next });
              }}
              className="text-xs font-bold px-2 py-1.5 rounded-lg border"
              style={{
                background: instrument === i ? "var(--color-accent)" : "var(--color-bg-elevated)",
                borderColor: "var(--color-bg-border)",
                color: instrument === i ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {ANALYSIS_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                const next = analysisType === t.value ? "" : t.value;
                setAnalysisType(next);
                applyAll({ analysisType: next });
              }}
              className="text-xs font-medium px-2 py-1.5 rounded-lg border"
              style={{
                background: analysisType === t.value ? "var(--color-accent)" : "var(--color-bg-elevated)",
                borderColor: "var(--color-bg-border)",
                color: analysisType === t.value ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
