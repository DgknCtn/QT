"use client";

import type { PrepFormData } from "../types";

const ENTRY_MODELS = [
  "MARKET", "LIMIT", "CISD_AFTER_CONFIRMATION", "FVG_GAP_REACTION",
  "PRC_CONTINUATION", "PSP_AGGRESSIVE", "SMTF_PG_CONTINUATION",
  "SD_REFINEMENT", "NO_ENTRY",
];
const ENTRY_LABELS: Record<string, string> = {
  MARKET: "Market", LIMIT: "Limit",
  CISD_AFTER_CONFIRMATION: "CISD after Conf.", FVG_GAP_REACTION: "FVG / Gap",
  PRC_CONTINUATION: "PRC Continuation", PSP_AGGRESSIVE: "PSP Aggressive",
  SMTF_PG_CONTINUATION: "SMTF / PG", SD_REFINEMENT: "SD Refinement",
  NO_ENTRY: "No Entry Yet",
};
const STOP_LOGICS = [
  { value: "SWING_HIGH_LOW",       label: "Swing H/L" },
  { value: "PRC_HIGH_LOW",         label: "PRC H/L" },
  { value: "GAP_FVG_INVALIDATION", label: "FVG Invalidation" },
  { value: "DFR_INVALIDATION",     label: "DFR Invalidation" },
  { value: "STRUCTURAL_INVALIDATION", label: "Structural" },
  { value: "OTHER",                label: "Other" },
];

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

function upd(data: PrepFormData, update: Props["update"], field: string, value: string) {
  update({ entry: { ...data.entry, [field]: value } });
}

export function Step9Entry({ data, update }: Props) {
  const entry = data.entry;

  // Calculate RR
  let rrDisplay = "—";
  if (entry.entryPrice && entry.stopPrice && entry.tp1) {
    const e = parseFloat(entry.entryPrice);
    const s = parseFloat(entry.stopPrice);
    const t = parseFloat(entry.tp1);
    if (s !== e && t !== e) {
      const rr = Math.abs(t - e) / Math.abs(s - e);
      rrDisplay = `1:${rr.toFixed(1)}`;
    }
  }

  // Warn if no stop
  const noStop = !entry.stopPrice;
  const noRisk = !entry.riskPercent;

  return (
    <div className="space-y-4 pt-3">
      {/* Entry model */}
      <div>
        <label className="step-label">Entry Model</label>
        <div className="flex flex-wrap gap-1.5">
          {ENTRY_MODELS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => upd(data, update, "entryModel", m)}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: entry.entryModel === m ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: entry.entryModel === m ? "var(--color-accent)" : "var(--color-bg-border)",
                color: entry.entryModel === m ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {ENTRY_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Prices grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="step-label">Entry Price</label>
          <input type="number" step="0.01" value={entry.entryPrice} onChange={(e) => upd(data, update, "entryPrice", e.target.value)} placeholder="Price" className="field-input" />
        </div>
        <div>
          <label className="step-label">
            Stop Price
            {noStop && entry.entryModel && entry.entryModel !== "NO_ENTRY" && (
              <span className="ml-1 text-xs" style={{ color: "var(--color-danger)" }}>required</span>
            )}
          </label>
          <input type="number" step="0.01" value={entry.stopPrice} onChange={(e) => upd(data, update, "stopPrice", e.target.value)} placeholder="Price" className="field-input" />
        </div>
      </div>

      {/* Stop logic */}
      <div>
        <label className="step-label">Stop Logic</label>
        <div className="flex flex-wrap gap-1.5">
          {STOP_LOGICS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => upd(data, update, "stopLogic", s.value)}
              className="px-2.5 py-1 rounded-md border text-xs transition-colors"
              style={{
                background: entry.stopLogic === s.value ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: entry.stopLogic === s.value ? "var(--color-accent)" : "var(--color-bg-border)",
                color: entry.stopLogic === s.value ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* TP levels */}
      <div className="grid grid-cols-3 gap-2">
        {["tp1", "tp2", "tp3"].map((tp, i) => (
          <div key={tp}>
            <label className="step-label">TP{i + 1}{i === 0 && <span className="ml-1 text-xs" style={{ color: "var(--color-danger)" }}>required</span>}</label>
            <input type="number" step="0.01" value={entry[tp as keyof typeof entry]} onChange={(e) => upd(data, update, tp, e.target.value)} placeholder="Price" className="field-input" />
          </div>
        ))}
      </div>

      {/* Main DOL */}
      <div>
        <label className="step-label">Main DOL (ultimate target)</label>
        <input type="number" step="0.01" value={entry.mainDol} onChange={(e) => upd(data, update, "mainDol", e.target.value)} placeholder="Price" className="field-input w-48" />
      </div>

      {/* Risk + USD Risk + RR */}
      <div className="flex items-end gap-4">
        <div>
          <label className="step-label">
            Risk %
            {noRisk && entry.entryModel && entry.entryModel !== "NO_ENTRY" && (
              <span className="ml-1 text-xs" style={{ color: "var(--color-danger)" }}>required</span>
            )}
          </label>
          <input type="number" step="0.1" min="0.1" max="10" value={entry.riskPercent} onChange={(e) => upd(data, update, "riskPercent", e.target.value)} placeholder="1.0" className="field-input w-28" />
        </div>
        <div>
          <label className="step-label">Risk (USD)</label>
          <input type="number" step="1" min="0" value={entry.riskUsd} onChange={(e) => upd(data, update, "riskUsd", e.target.value)} placeholder="100" className="field-input w-28" />
        </div>
        <div className="pb-1">
          <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Est. RR (to TP1)</p>
          <p className="text-lg font-bold" style={{ color: rrDisplay === "—" ? "var(--color-text-muted)" : "var(--color-success)" }}>
            {rrDisplay}
          </p>
        </div>
      </div>

      {noStop && entry.entryModel && entry.entryModel !== "NO_ENTRY" && (
        <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            No stop defined. GO is blocked until a stop is set.
          </p>
        </div>
      )}
    </div>
  );
}
