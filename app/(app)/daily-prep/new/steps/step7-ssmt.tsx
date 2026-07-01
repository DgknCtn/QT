"use client";

import type { PrepFormData } from "../types";

const FORMED_OPTIONS = ["YES", "NO", "WATCHING", "NOT_APPLICABLE"];
const SSMT_TYPES = ["STANDARD_SSMT", "HSSMT", "ISSMT", "SD", "SMTF", "PG", "OC_DIVERGENCE", "OTHER"];
const SSMT_LOCATIONS = [
  { value: "PREV_QUARTER_HIGH", label: "Prev Quarter High" },
  { value: "PREV_QUARTER_LOW",  label: "Prev Quarter Low" },
  { value: "PREV_DAY_HIGH",     label: "Prev Day High" },
  { value: "PREV_DAY_LOW",      label: "Prev Day Low" },
  { value: "PREV_6H_HIGH_LOW",  label: "Prev 6H H/L" },
  { value: "DFR_HIGH_LOW",      label: "DFR H/L" },
  { value: "DFR_PROJECTION",    label: "DFR Projection" },
  { value: "TRUE_OPEN",         label: "True Open" },
  { value: "NWOG_NDOG",         label: "NWOG / NDOG" },
  { value: "OTHER",             label: "Other" },
];
const TIMEFRAMES = ["WEEKLY", "DAILY", "H4", "H1", "M90", "M15", "M5", "M1"];
const THREE_STATE = ["YES", "NO", "PARTIAL", "UNSURE"];

const BEHAVIOR_OPTIONS: { value: string; label: string }[] = [
  { value: "RAIDED_HIGH",   label: "Raided High" },
  { value: "RAIDED_LOW",    label: "Raided Low" },
  { value: "PROTECTED_HIGH",label: "Protected High" },
  { value: "PROTECTED_LOW", label: "Protected Low" },
  { value: "CONFIRMED",     label: "Confirmed" },
  { value: "DID_NOT_CONFIRM", label: "Did Not Confirm" },
  { value: "NEUTRAL",       label: "Neutral" },
];

// A behavior "points long" if it takes lows (raid low / protect low) and "points short" if it takes highs.
function behaviorDirection(v: string): "LONG" | "SHORT" | null {
  if (v === "RAIDED_LOW" || v === "PROTECTED_LOW") return "LONG";
  if (v === "RAIDED_HIGH" || v === "PROTECTED_HIGH") return "SHORT";
  return null;
}

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

function upd(data: PrepFormData, update: Props["update"], field: string, value: unknown) {
  update({ ssmt: { ...data.ssmt, [field]: value } });
}

function Chip({ value, selected, onClick }: { value: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-md border text-xs font-medium transition-colors"
      style={{
        background: selected ? "var(--color-accent)" : "var(--color-bg-surface)",
        borderColor: selected ? "var(--color-accent)" : "var(--color-bg-border)",
        color: selected ? "#fff" : "var(--color-text-secondary)",
      }}
    >
      {value.replace(/_/g, " ")}
    </button>
  );
}

export function Step7SSMT({ data, update }: Props) {
  const ssmt = data.ssmt;
  const ssmtFormed = ssmt.formed === "YES";

  // Triad assets
  const assets: string[] = {
    NQ_ES_YM: ["NQ", "ES", "YM"],
    EU_GU_DXY: ["EUR/USD", "GBP/USD", "DXY"],
    BTC_ETH_TOTAL3: ["BTC", "ETH", "TOTAL3"],
  }[data.triad] ?? ["Asset A", "Asset B", "Asset C"];

  return (
    <div className="space-y-4 pt-3">
      {/* Formed */}
      <div>
        <label className="step-label">Did SSMT Form?</label>
        <div className="flex gap-2">
          {FORMED_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => upd(data, update, "formed", f)}
              className="flex-1 py-2 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: ssmt.formed === f
                  ? f === "YES" ? "rgba(52,201,126,0.2)" : f === "NO" ? "rgba(239,68,68,0.2)" : "rgba(79,142,247,0.15)"
                  : "var(--color-bg-surface)",
                borderColor: ssmt.formed === f
                  ? f === "YES" ? "var(--color-success)" : f === "NO" ? "var(--color-danger)" : "var(--color-accent)"
                  : "var(--color-bg-border)",
                color: ssmt.formed === f
                  ? f === "YES" ? "var(--color-success)" : f === "NO" ? "var(--color-danger)" : "var(--color-accent)"
                  : "var(--color-text-secondary)",
              }}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {ssmtFormed && (
        <>
          {/* SSMT Type */}
          <div>
            <label className="step-label">SSMT Type</label>
            <div className="flex flex-wrap gap-1.5">
              {SSMT_TYPES.map((t) => (
                <Chip key={t} value={t} selected={ssmt.ssmtType === t} onClick={() => upd(data, update, "ssmtType", t)} />
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="step-label">Location</label>
            <div className="flex flex-wrap gap-1.5">
              {SSMT_LOCATIONS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => upd(data, update, "locationType", l.value)}
                  className="px-2.5 py-1 rounded-md border text-xs transition-colors"
                  style={{
                    background: ssmt.locationType === l.value ? "var(--color-accent)" : "var(--color-bg-surface)",
                    borderColor: ssmt.locationType === l.value ? "var(--color-accent)" : "var(--color-bg-border)",
                    color: ssmt.locationType === l.value ? "#fff" : "var(--color-text-secondary)",
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              step="0.01"
              value={ssmt.locationPrice}
              onChange={(e) => upd(data, update, "locationPrice", e.target.value)}
              placeholder="Location price (optional)"
              className="field-input mt-2 w-40"
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="step-label">Timeframe</label>
            <div className="flex flex-wrap gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <Chip key={tf} value={tf} selected={ssmt.timeframe === tf} onClick={() => upd(data, update, "timeframe", tf)} />
              ))}
            </div>
          </div>

          {/* Triad behavior */}
          <div>
            <label className="step-label">Triad Behavior</label>
            <div className="space-y-2">
              {assets.map((asset, i) => {
                const field = ["assetABehavior", "assetBBehavior", "assetCBehavior"][i];
                const current = [ssmt.assetABehavior, ssmt.assetBBehavior, ssmt.assetCBehavior][i];
                return (
                  <div key={asset} className="flex items-start gap-3">
                    <span className="text-xs font-bold w-16 shrink-0 pt-1.5" style={{ color: "var(--color-accent)" }}>{asset}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {BEHAVIOR_OPTIONS.map((b) => (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => upd(data, update, field, current === b.value ? "" : b.value)}
                          className="px-2 py-1 rounded-md border text-xs transition-colors"
                          style={{
                            background: current === b.value ? "var(--color-accent)" : "var(--color-bg-surface)",
                            borderColor: current === b.value ? "var(--color-accent)" : "var(--color-bg-border)",
                            color: current === b.value ? "#fff" : "var(--color-text-secondary)",
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Triad alignment warning */}
            {(() => {
              const behaviors = [ssmt.assetABehavior, ssmt.assetBBehavior, ssmt.assetCBehavior];
              const filled = behaviors.filter((b) => b && b.trim() !== "");
              const dirs = filled.map(behaviorDirection).filter((d): d is "LONG" | "SHORT" => d !== null);
              const bias = data.htfBias;
              if (filled.length > 0 && filled.length < 3) {
                return (
                  <p className="text-xs mt-2" style={{ color: "var(--color-warning)" }}>
                    Triad korelasyonu eksik — üç asset&apos;in de davranışını işaretle.
                  </p>
                );
              }
              if (dirs.length >= 2) {
                const allLong = dirs.every((d) => d === "LONG");
                const allShort = dirs.every((d) => d === "SHORT");
                if (!allLong && !allShort) {
                  return (
                    <p className="text-xs mt-2" style={{ color: "var(--color-warning)" }}>
                      Asset&apos;ler aynı yönü göstermiyor — korelasyon zayıf, SSMT kalitesi düşük olabilir.
                    </p>
                  );
                }
                if ((bias === "LONG" && allShort) || (bias === "SHORT" && allLong)) {
                  return (
                    <p className="text-xs mt-2" style={{ color: "var(--color-warning)" }}>
                      Triad {allLong ? "long" : "short"} sinyali veriyor ama HTF bias {bias}. Çelişkiyi açıkla ya da bias&apos;ı gözden geçir.
                    </p>
                  );
                }
              }
              return null;
            })()}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="step-label">Strong Asset</label>
                <div className="flex gap-1.5">
                  {assets.map((a) => (
                    <button key={a} type="button" onClick={() => upd(data, update, "strongAsset", a)}
                      className="flex-1 py-1.5 rounded text-xs border transition-colors"
                      style={{
                        background: ssmt.strongAsset === a ? "rgba(52,201,126,0.2)" : "var(--color-bg-surface)",
                        borderColor: ssmt.strongAsset === a ? "var(--color-success)" : "var(--color-bg-border)",
                        color: ssmt.strongAsset === a ? "var(--color-success)" : "var(--color-text-muted)",
                      }}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="step-label">Weak Asset</label>
                <div className="flex gap-1.5">
                  {assets.map((a) => (
                    <button key={a} type="button" onClick={() => upd(data, update, "weakAsset", a)}
                      className="flex-1 py-1.5 rounded text-xs border transition-colors"
                      style={{
                        background: ssmt.weakAsset === a ? "rgba(239,68,68,0.2)" : "var(--color-bg-surface)",
                        borderColor: ssmt.weakAsset === a ? "var(--color-danger)" : "var(--color-bg-border)",
                        color: ssmt.weakAsset === a ? "var(--color-danger)" : "var(--color-text-muted)",
                      }}>{a}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="step-label">Aligns with HTF Bias?</label>
              <div className="flex gap-1.5">
                {THREE_STATE.map((s) => (
                  <Chip key={s} value={s} selected={ssmt.alignsWithBias === s} onClick={() => upd(data, update, "alignsWithBias", s)} />
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ssmt.randomSmtFlag} onChange={(e) => upd(data, update, "randomSmtFlag", e.target.checked)} className="w-3.5 h-3.5 rounded accent-yellow-500" />
                <span className="text-xs" style={{ color: ssmt.randomSmtFlag ? "var(--color-warning)" : "var(--color-text-secondary)" }}>
                  Random swing SMT (lower quality)
                </span>
              </label>
            </div>
          </div>
        </>
      )}

      {/* No SSMT on reversal warning */}
      {ssmt.formed === "NO" && (
        <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            No SSMT logged. If this is a reversal idea, setup quality will be penalized. Continue only if this is a planned exception.
          </p>
        </div>
      )}

      <div>
        <label className="step-label">Notes</label>
        <textarea value={ssmt.notes} onChange={(e) => upd(data, update, "notes", e.target.value)} rows={2} placeholder="SSMT context notes…" className="field-input resize-none" />
      </div>
    </div>
  );
}
