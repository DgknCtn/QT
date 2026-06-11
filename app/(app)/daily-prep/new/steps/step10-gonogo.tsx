"use client";

import type { PrepFormData } from "../types";
import { CheckCircle2, XCircle, Clock, AlertCircle, MinusCircle } from "lucide-react";

const DECISIONS = [
  { value: "GO",           label: "GO",           color: "var(--color-go)",    icon: CheckCircle2 },
  { value: "WAIT",         label: "WAIT",         color: "var(--color-wait)",  icon: Clock },
  { value: "NO_GO",        label: "NO-GO",        color: "var(--color-nogo)",  icon: XCircle },
  { value: "REVIEW_LATER", label: "REVIEW LATER", color: "var(--color-warn)",  icon: AlertCircle },
  { value: "MISSED_SETUP", label: "MISSED",       color: "var(--color-text-muted)", icon: MinusCircle },
];

type Props = {
  data: PrepFormData;
  update: (p: Partial<PrepFormData>) => void;
  onSave: () => void;
  saving: boolean;
};

function checkHardBlocks(data: PrepFormData): string[] {
  const blocks: string[] = [];
  if (!data.htfBias || !data.htfBiasExplanation) blocks.push("HTF narrative incomplete");
  if (!data.entry.stopPrice && data.entry.entryModel && data.entry.entryModel !== "NO_ENTRY")
    blocks.push("No stop defined");
  if (!data.entry.riskPercent && data.entry.entryModel && data.entry.entryModel !== "NO_ENTRY")
    blocks.push("No risk % defined");
  if (data.ssmt.formed === "NO" && data.htfBias !== "WAIT" && data.htfBias !== "NEUTRAL")
    blocks.push("No SSMT / crack on directional idea (reversal risk)");
  return blocks;
}

function checkSoftWarnings(data: PrepFormData): string[] {
  const warnings: string[] = [];
  if (!data.confirmation.confirmationType) warnings.push("No confirmation type selected");
  if (data.dfr.dfrType && !data.dfr.dfrHigh) warnings.push("DFR type set but no levels entered");
  if (!data.active90mCycle) warnings.push("90m quarter not selected");
  return warnings;
}

function buildSummary(data: PrepFormData): string {
  const bias = data.htfBias || "unknown";
  const cycle = data.activeCycleWeekly ? data.activeCycleWeekly.replace(/_/g, " ") : "unknown cycle";
  const ssmt = data.ssmt.formed === "YES" ? `${data.ssmt.ssmtType?.replace(/_/g, " ")} at ${data.ssmt.locationType?.replace(/_/g, " ")}` : "no crack";
  const conf = data.confirmation.confirmationType ? `${data.confirmation.confirmationType} (${data.confirmation.timeframe})` : "no confirmation";
  const entry = data.entry.entryModel ? data.entry.entryModel.replace(/_/g, " ") : "no entry";
  const risk = data.entry.riskPercent ? `${data.entry.riskPercent}%` : "?%";
  const target = data.htfTarget || "unknown target";

  return `HTF bias is ${bias}. I am in ${cycle}. SSMT: ${ssmt}. Confirmation: ${conf}. Entry: ${entry}. Target: ${target}. Risk: ${risk}.`;
}

export function Step10GoNoGo({ data, update, onSave, saving }: Props) {
  const hardBlocks = checkHardBlocks(data);
  const softWarnings = checkSoftWarnings(data);
  const summary = buildSummary(data);
  const canGo = hardBlocks.length === 0;

  return (
    <div className="space-y-4 pt-3">
      {/* Auto-generated summary */}
      <div className="rounded-lg border p-3" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}>
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>GO Sentence (auto-generated)</p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{summary}</p>
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          If you cannot confirm this sentence, consider NO-GO.
        </p>
      </div>

      {/* Hard blocks */}
      {hardBlocks.length > 0 && (
        <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--color-danger)" }}>Hard blocks (GO disabled):</p>
          {hardBlocks.map((b) => (
            <p key={b} className="text-xs" style={{ color: "var(--color-danger)" }}>• {b}</p>
          ))}
        </div>
      )}

      {/* Soft warnings */}
      {softWarnings.length > 0 && (
        <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--color-warning)" }}>Warnings:</p>
          {softWarnings.map((w) => (
            <p key={w} className="text-xs" style={{ color: "var(--color-warning)" }}>• {w}</p>
          ))}
        </div>
      )}

      {/* Decision buttons */}
      <div>
        <label className="step-label">Decision</label>
        <div className="grid grid-cols-5 gap-2">
          {DECISIONS.map(({ value, label, color, icon: Icon }) => {
            const isGoBlocked = value === "GO" && !canGo;
            const selected = data.goNoGoStatus === value;
            return (
              <button
                key={value}
                type="button"
                disabled={isGoBlocked}
                onClick={() => update({ goNoGoStatus: value })}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-30"
                style={{
                  background: selected ? `${color}22` : "var(--color-bg-surface)",
                  borderColor: selected ? color : "var(--color-bg-border)",
                  color: selected ? color : "var(--color-text-muted)",
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* GO reason */}
      <div>
        <label className="step-label">
          {data.goNoGoStatus === "GO" ? "GO Confirmation Note" : "Reason / Override Note"}
        </label>
        <textarea
          value={data.goNoGoReason}
          onChange={(e) => update({ goNoGoReason: e.target.value })}
          rows={2}
          placeholder={data.goNoGoStatus === "NO_GO" ? "Why NO-GO? What's missing?" : "Confirm the plan in your own words…"}
          className="field-input resize-none"
        />
      </div>

      {/* General notes */}
      <div>
        <label className="step-label">General Notes</label>
        <textarea
          value={data.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={2}
          placeholder="Any additional context for today's prep…"
          className="field-input resize-none"
        />
      </div>

      {/* Final save */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !data.goNoGoStatus}
        className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
        style={{
          background: data.goNoGoStatus === "GO" ? "var(--color-go)" : data.goNoGoStatus === "NO_GO" ? "var(--color-nogo)" : "var(--color-accent)",
          color: "#fff",
        }}
      >
        {saving ? "Saving…" : data.goNoGoStatus ? `Save with ${data.goNoGoStatus.replace("_", "-")}` : "Select a decision first"}
      </button>
    </div>
  );
}
