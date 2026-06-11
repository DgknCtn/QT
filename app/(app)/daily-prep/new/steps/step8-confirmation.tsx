"use client";

import type { PrepFormData } from "../types";

const CONF_TYPES = ["PSP", "PRC", "SMTF", "PG", "OC_DIVERGENCE", "CISD", "FVG_REACTION", "SD_REFINEMENT", "NONE"];
const TIMEFRAMES = ["WEEKLY", "DAILY", "H1", "M90", "M15", "M5", "M1", "S15"];
const THREE_STATE = ["YES", "NO", "UNSURE"];

// TF alignment rules based on SSMT timeframe
const TF_RULES: Record<string, string> = {
  WEEKLY: "1H PSP expected",
  DAILY: "15m PSP expected",
  M90: "5m PSP expected",
  M15: "1m PSP expected",
  M5: "1m PSP expected",
};

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

function upd(data: PrepFormData, update: Props["update"], field: string, value: unknown) {
  update({ confirmation: { ...data.confirmation, [field]: value } });
}

export function Step8Confirmation({ data, update }: Props) {
  const conf = data.confirmation;
  const ssmtTF = data.ssmt.timeframe;
  const tfRule = ssmtTF ? TF_RULES[ssmtTF] : null;

  // Warn if LTF confirmation while HTF is Daily/Weekly
  const lowTfWarning = (conf.timeframe === "M1" || conf.timeframe === "S15") &&
    (ssmtTF === "WEEKLY" || ssmtTF === "DAILY") &&
    conf.confirmationType !== "NONE";

  return (
    <div className="space-y-4 pt-3">
      {/* TF rule hint */}
      {tfRule && (
        <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(79,142,247,0.08)", color: "var(--color-accent)" }}>
          Based on {ssmtTF} SSMT: <strong>{tfRule}</strong>
        </div>
      )}

      {/* Confirmation type */}
      <div>
        <label className="step-label">Confirmation Type</label>
        <div className="flex flex-wrap gap-1.5">
          {CONF_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => upd(data, update, "confirmationType", t)}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: conf.confirmationType === t ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: conf.confirmationType === t ? "var(--color-accent)" : "var(--color-bg-border)",
                color: conf.confirmationType === t ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe */}
      <div>
        <label className="step-label">Confirmation Timeframe</label>
        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => upd(data, update, "timeframe", tf)}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: conf.timeframe === tf ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: conf.timeframe === tf ? "var(--color-accent)" : "var(--color-bg-border)",
                color: conf.timeframe === tf ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {lowTfWarning && (
        <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <p className="text-xs" style={{ color: "var(--color-warning)" }}>
            Low timeframe confirmation may be too early for a {ssmtTF} SSMT. Confirm HTF narrative and higher TF confirmation first.
          </p>
        </div>
      )}

      {/* TF alignment */}
      <div>
        <label className="step-label">Timeframe Alignment Valid?</label>
        <div className="flex gap-1.5">
          {THREE_STATE.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => upd(data, update, "tfAlignmentValid", s)}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: conf.tfAlignmentValid === s ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: conf.tfAlignmentValid === s ? "var(--color-accent)" : "var(--color-bg-border)",
                color: conf.tfAlignmentValid === s ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="step-label">Notes</label>
        <textarea value={conf.notes} onChange={(e) => upd(data, update, "notes", e.target.value)} rows={2} placeholder="Confirmation details…" className="field-input resize-none" />
      </div>
    </div>
  );
}
