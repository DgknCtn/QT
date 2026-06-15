"use client";

import type { PrepFormData } from "../types";

const PO3_STATES = ["ACCUMULATION", "MANIPULATION", "DISTRIBUTION", "X", "UNKNOWN"];
const MMXM_STAGES = ["ACCUMULATION", "MANIPULATION", "DISTRIBUTION", "REVERSAL", "CONTINUATION", "UNKNOWN"];
const BIAS_OPTIONS = ["LONG", "SHORT", "WAIT"];
const LIQ_TARGETS = [
  "PREV_DAY_HIGH", "PREV_DAY_LOW", "PREV_WEEK_HIGH", "PREV_WEEK_LOW",
  "PREV_6H_HIGH", "PREV_6H_LOW", "DFR_PROJECTION", "NWOG_NDOG",
  "FVG_IMBALANCE", "EQUAL_HIGHS_LOWS", "CUSTOM",
];
const LIQ_LABELS: Record<string, string> = {
  PREV_DAY_HIGH: "Prev Day High", PREV_DAY_LOW: "Prev Day Low",
  PREV_WEEK_HIGH: "Prev Week High", PREV_WEEK_LOW: "Prev Week Low",
  PREV_6H_HIGH: "Prev 6H High", PREV_6H_LOW: "Prev 6H Low",
  DFR_PROJECTION: "DFR Projection", NWOG_NDOG: "NWOG / NDOG",
  FVG_IMBALANCE: "FVG / Imbalance", EQUAL_HIGHS_LOWS: "Equal Highs/Lows",
  CUSTOM: "Custom",
};

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

function ChipRow({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
          style={{
            background: selected === v ? "var(--color-accent)" : "var(--color-bg-surface)",
            borderColor: selected === v ? "var(--color-accent)" : "var(--color-bg-border)",
            color: selected === v ? "#fff" : "var(--color-text-secondary)",
          }}
        >
          {v.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

export function Step2Narrative({ data, update }: Props) {
  const biasColor = { LONG: "var(--color-long)", SHORT: "var(--color-short)", NEUTRAL: "var(--color-text-muted)", WAIT: "var(--color-wait)" };

  return (
    <div className="space-y-4 pt-3">
      {/* Bias */}
      <div>
        <label className="step-label">HTF Bias</label>
        <div className="flex gap-2">
          {BIAS_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => update({ htfBias: b })}
              className="flex-1 py-2 rounded-lg border text-sm font-bold transition-colors"
              style={{
                background: data.htfBias === b ? "rgba(79,142,247,0.12)" : "var(--color-bg-surface)",
                borderColor: data.htfBias === b ? (biasColor[b as keyof typeof biasColor] ?? "var(--color-accent)") : "var(--color-bg-border)",
                color: data.htfBias === b ? (biasColor[b as keyof typeof biasColor] ?? "var(--color-text-primary)") : "var(--color-text-secondary)",
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* HTF Target */}
      <div>
        <label className="step-label">HTF Target / DOL</label>
        <input
          type="text"
          value={data.htfTarget}
          onChange={(e) => update({ htfTarget: e.target.value })}
          placeholder="e.g. prev day low, DFR projection…"
          className="field-input"
        />
      </div>

      {/* Liquidity target */}
      <div>
        <label className="step-label">Main Liquidity Target</label>
        <div className="flex flex-wrap gap-1.5">
          {LIQ_TARGETS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update({ mainLiquidityTarget: t })}
              className="px-2.5 py-1 rounded-md text-xs border transition-colors"
              style={{
                background: data.mainLiquidityTarget === t ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: data.mainLiquidityTarget === t ? "var(--color-accent)" : "var(--color-bg-border)",
                color: data.mainLiquidityTarget === t ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {LIQ_LABELS[t]}
            </button>
          ))}
        </div>
        {data.mainLiquidityTarget === "CUSTOM" && (
          <input
            type="text"
            value={data.customLiqTarget}
            onChange={(e) => update({ customLiqTarget: e.target.value })}
            placeholder="Describe custom target"
            className="field-input mt-2"
          />
        )}
      </div>

      {/* Bias explanation */}
      <div>
        <label className="step-label">
          Bias Explanation
          {(data.htfBias === "LONG" || data.htfBias === "SHORT") && (
            <span className="ml-1 text-xs" style={{ color: "var(--color-danger)" }}>required</span>
          )}
        </label>
        <textarea
          value={data.htfBiasExplanation}
          onChange={(e) => update({ htfBiasExplanation: e.target.value })}
          rows={2}
          placeholder="Why is this the bias? HTF context, liquidity taken, narrative…"
          className="field-input resize-none"
        />
        {(data.htfBias === "LONG" || data.htfBias === "SHORT") && !data.htfBiasExplanation && (
          <p className="text-xs mt-1" style={{ color: "var(--color-warning)" }}>
            Bias without explanation is incomplete. Define where price is being delivered.
          </p>
        )}
      </div>

      {/* PO3 / MMxM */}
      <div className="grid grid-cols-1 gap-3 pt-1 border-t" style={{ borderColor: "var(--color-bg-border)" }}>
        <div>
          <label className="step-label">Weekly PO3 State</label>
          <ChipRow values={PO3_STATES} selected={data.weeklyPo3State} onSelect={(v) => update({ weeklyPo3State: v })} />
        </div>
        <div>
          <label className="step-label">Daily PO3 State</label>
          <ChipRow values={PO3_STATES} selected={data.dailyPo3State} onSelect={(v) => update({ dailyPo3State: v })} />
        </div>
        <div>
          <label className="step-label">HTF MMxM Stage</label>
          <ChipRow values={MMXM_STAGES} selected={data.mmxmStage} onSelect={(v) => update({ mmxmStage: v })} />
        </div>
      </div>
    </div>
  );
}
