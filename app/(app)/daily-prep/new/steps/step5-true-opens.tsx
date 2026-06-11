"use client";

import type { PrepFormData, TrueOpenEntry } from "../types";

const TRUE_OPENS = [
  { key: "TYO",  label: "TYO", sub: "True Year Open",    tf: "Monthly" },
  { key: "TMO",  label: "TMO", sub: "True Month Open",   tf: "Weekly" },
  { key: "TWO",  label: "TWO", sub: "True Week Open",    tf: "Daily" },
  { key: "TDO",  label: "TDO", sub: "True Day Open",     tf: "H1–H4" },
  { key: "TSO",  label: "TSO", sub: "True Session Open", tf: "90m" },
  { key: "TMSO", label: "TMSO",sub: "True Micro Session Open", tf: "15m" },
];

const POSITIONS = ["ABOVE", "BELOW", "AT"];
const INTERPRETATIONS = [
  { value: "PREMIUM",  label: "Premium / Short-Favorable" },
  { value: "DISCOUNT", label: "Discount / Long-Favorable" },
  { value: "NEUTRAL",  label: "Neutral" },
];

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

export function Step5TrueOpens({ data, update }: Props) {
  function updateTO(key: string, field: keyof TrueOpenEntry, value: string) {
    update({
      trueOpens: {
        ...data.trueOpens,
        [key]: { ...data.trueOpens[key], [field]: value },
      },
    });
  }

  // Detect conflicts
  const hasConflict = (key: string) => {
    const to = data.trueOpens[key];
    if (!to.price) return false;
    if (data.htfBias === "LONG" && to.position === "ABOVE") return true;
    if (data.htfBias === "SHORT" && to.position === "BELOW") return true;
    return false;
  };

  return (
    <div className="space-y-3 pt-3">
      {TRUE_OPENS.map(({ key, label, sub, tf }) => {
        const to = data.trueOpens[key] || { price: "", position: "", interpretation: "", notes: "" };
        const conflict = hasConflict(key);

        return (
          <div
            key={key}
            className="rounded-lg border p-3 space-y-2"
            style={{
              background: "var(--color-bg-surface)",
              borderColor: conflict ? "rgba(245,158,11,0.5)" : "var(--color-bg-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-10" style={{ color: "var(--color-accent)" }}>{label}</span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{sub}</span>
              <span className="text-xs px-1.5 py-0.5 rounded ml-auto" style={{ background: "var(--color-bg-border)", color: "var(--color-text-muted)" }}>
                {tf}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Price */}
              <input
                type="number"
                step="0.01"
                value={to.price}
                onChange={(e) => updateTO(key, "price", e.target.value)}
                placeholder="Price"
                className="field-input"
              />

              {/* Position */}
              <div className="flex gap-1">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateTO(key, "position", p)}
                    className="flex-1 py-1.5 rounded text-xs border font-medium transition-colors"
                    style={{
                      background: to.position === p
                        ? p === "ABOVE" ? "rgba(239,68,68,0.2)" : p === "BELOW" ? "rgba(52,201,126,0.2)" : "var(--color-bg-hover)"
                        : "transparent",
                      borderColor: to.position === p
                        ? p === "ABOVE" ? "var(--color-danger)" : p === "BELOW" ? "var(--color-success)" : "var(--color-text-muted)"
                        : "var(--color-bg-border)",
                      color: to.position === p
                        ? p === "ABOVE" ? "var(--color-danger)" : p === "BELOW" ? "var(--color-success)" : "var(--color-text-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Interpretation */}
              <select
                value={to.interpretation}
                onChange={(e) => updateTO(key, "interpretation", e.target.value)}
                className="field-input"
              >
                <option value="">— Context —</option>
                {INTERPRETATIONS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>

            {conflict && (
              <p className="text-xs" style={{ color: "var(--color-warning)" }}>
                ⚠ {data.htfBias === "LONG" ? "Long" : "Short"} idea conflicts with {to.position === "ABOVE" ? "premium" : "discount"} context. Explain why this is still valid.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
