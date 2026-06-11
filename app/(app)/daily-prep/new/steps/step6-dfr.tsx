"use client";

import type { PrepFormData } from "../types";

const DFR_TYPES = [
  { value: "MONTHLY",     label: "Monthly DFR",      tf: "4H" },
  { value: "WEEKLY",      label: "Weekly DFR",       tf: "1H" },
  { value: "DAILY_ADFR",  label: "Daily / ADFR",     tf: "15m" },
  { value: "M90",         label: "90m DFR",          tf: "5m" },
  { value: "CUSTOM",      label: "Custom",           tf: "" },
];
const Q1_QUALITIES = ["CONSOLIDATION", "EXPANSION", "MIXED", "UNKNOWN"];
const THREE_STATE = ["YES", "NO", "UNSURE"];

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

function calcScore(dfr: PrepFormData["dfr"], htfBias: string): { score: number; band: string; label: string } {
  let s = 0;
  if (dfr.q1Quality === "CONSOLIDATION") s += 2;
  if (dfr.q1Quality === "EXPANSION") s -= 2;
  if (dfr.highLowEqualsQ1 === "YES") s += 2;
  if (dfr.highLowEqualsQ1 === "NO") s -= 2;
  if (dfr.alignsWithBias) s += 1;
  if (dfr.nearPriorPoi) s += 1;

  const band = s >= 4 ? "HIGH" : s >= 1 ? "MEDIUM" : "LOW";
  const label = s >= 4 ? "High Quality" : s >= 1 ? "Medium Quality" : "Low Quality";
  return { score: s, band, label };
}

export function Step6DFR({ data, update }: Props) {
  const dfr = data.dfr;
  const { score, band, label } = calcScore(dfr, data.htfBias);
  const bandColor = band === "HIGH" ? "var(--color-success)" : band === "MEDIUM" ? "var(--color-warning)" : "var(--color-danger)";

  function upd(field: keyof typeof dfr, value: unknown) {
    // Auto-calculate midpoint
    let mid = dfr.dfrMid;
    const high = field === "dfrHigh" ? (value as string) : dfr.dfrHigh;
    const low  = field === "dfrLow"  ? (value as string) : dfr.dfrLow;
    if (high && low) {
      mid = ((parseFloat(high) + parseFloat(low)) / 2).toFixed(2);
    }
    update({ dfr: { ...dfr, [field]: value, dfrMid: mid } });
  }

  return (
    <div className="space-y-4 pt-3">
      {/* DFR Type */}
      <div>
        <label className="step-label">DFR Type</label>
        <div className="flex flex-wrap gap-1.5">
          {DFR_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => upd("dfrType", t.value)}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: dfr.dfrType === t.value ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: dfr.dfrType === t.value ? "var(--color-accent)" : "var(--color-bg-border)",
                color: dfr.dfrType === t.value ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {t.label}
              {t.tf && <span className="ml-1" style={{ color: dfr.dfrType === t.value ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)" }}>({t.tf})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* DFR Levels */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="step-label">DFR High</label>
          <input type="number" step="0.01" value={dfr.dfrHigh} onChange={(e) => upd("dfrHigh", e.target.value)} placeholder="Price" className="field-input" />
        </div>
        <div>
          <label className="step-label">DFR Low</label>
          <input type="number" step="0.01" value={dfr.dfrLow} onChange={(e) => upd("dfrLow", e.target.value)} placeholder="Price" className="field-input" />
        </div>
        <div>
          <label className="step-label">DFR 0.5 (auto)</label>
          <input type="number" step="0.01" value={dfr.dfrMid} readOnly className="field-input opacity-60 cursor-default" />
        </div>
      </div>

      {/* Q1 quality + equals Q1 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="step-label">Q1 Nature</label>
          <div className="flex gap-1.5">
            {Q1_QUALITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => upd("q1Quality", q)}
                className="flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                style={{
                  background: dfr.q1Quality === q ? "var(--color-accent)" : "var(--color-bg-surface)",
                  borderColor: dfr.q1Quality === q ? "var(--color-accent)" : "var(--color-bg-border)",
                  color: dfr.q1Quality === q ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="step-label">DFR H/L = Q1 H/L?</label>
          <div className="flex gap-1.5">
            {THREE_STATE.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => upd("highLowEqualsQ1", s)}
                className="flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                style={{
                  background: dfr.highLowEqualsQ1 === s ? "var(--color-accent)" : "var(--color-bg-surface)",
                  borderColor: dfr.highLowEqualsQ1 === s ? "var(--color-accent)" : "var(--color-bg-border)",
                  color: dfr.highLowEqualsQ1 === s ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={dfr.alignsWithBias} onChange={(e) => upd("alignsWithBias", e.target.checked)} className="w-3.5 h-3.5 rounded accent-blue-500" />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Aligns with HTF bias</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={dfr.nearPriorPoi} onChange={(e) => upd("nearPriorPoi", e.target.checked)} className="w-3.5 h-3.5 rounded accent-blue-500" />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Near prior POI / TOI</span>
        </label>
      </div>

      {/* Quality score */}
      {(dfr.q1Quality || dfr.highLowEqualsQ1) && (
        <div className="rounded-lg p-3 border" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: bandColor }}>{label}</span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Score: {score}</span>
          </div>
          {band === "LOW" && (
            <p className="text-xs mt-1" style={{ color: "var(--color-warning)" }}>
              Low quality DFR. Avoid using as main trade reason or blind limit entry.
            </p>
          )}
        </div>
      )}

      <div>
        <label className="step-label">Notes</label>
        <textarea value={dfr.notes} onChange={(e) => upd("notes", e.target.value)} rows={2} placeholder="DFR context notes…" className="field-input resize-none" />
      </div>
    </div>
  );
}
