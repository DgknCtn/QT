"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Step1Market } from "./steps/step1-market";
import { Step2Narrative } from "./steps/step2-narrative";
import { Step3Calendar } from "./steps/step3-calendar";
import { Step4Cycle } from "./steps/step4-cycle";
import { Step5TrueOpens } from "./steps/step5-true-opens";
import { Step6DFR } from "./steps/step6-dfr";
import { Step7SSMT } from "./steps/step7-ssmt";
import { Step8Confirmation } from "./steps/step8-confirmation";
import { Step9Entry } from "./steps/step9-entry";
import { Step10GoNoGo } from "./steps/step10-gonogo";
import { saveDailyPrep, updateDailyPrep, type CalendarEventItem } from "./actions";
import type { PrepFormData } from "./types";

const STEPS = [
  { id: 1, label: "Market & Session",    required: true },
  { id: 2, label: "HTF Narrative",       required: true },
  { id: 3, label: "Economic Calendar",   required: false },
  { id: 4, label: "Cycle & Quarter",     required: true },
  { id: 5, label: "True Opens",          required: true },
  { id: 6, label: "DFR Planner",         required: false },
  { id: 7, label: "SSMT / Crack",        required: true },
  { id: 8, label: "Confirmation",        required: true },
  { id: 9, label: "Entry Plan",          required: true },
  { id: 10, label: "GO / NO-GO",         required: true },
];

const EMPTY_FORM: PrepFormData = {
  // Step 1
  session: "",
  marketGroup: "",
  triad: "",
  primaryInstrument: "",
  secondaryInstruments: [],
  // Step 2
  htfBias: "",
  htfBiasConfidence: "MEDIUM",
  htfTarget: "",
  htfInvalidation: "",
  htfBiasExplanation: "",
  weeklyPo3State: "UNKNOWN",
  dailyPo3State: "UNKNOWN",
  mmxmStage: "UNKNOWN",
  mainLiquidityTarget: "",
  customLiqTarget: "",
  // Step 3
  newsEvents: [],
  // Step 4
  activeCycleWeekly: "",
  activeCycleDaily: "",
  active90mCycle: "",
  activeMicroCycle: "",
  q1Quality: "",
  expectedBehavior: "",
  // Step 5
  trueOpens: {
    TYO: { price: "", position: "", interpretation: "", notes: "" },
    TMO: { price: "", position: "", interpretation: "", notes: "" },
    TWO: { price: "", position: "", interpretation: "", notes: "" },
    TDO: { price: "", position: "", interpretation: "", notes: "" },
    TSO: { price: "", position: "", interpretation: "", notes: "" },
    TMSO: { price: "", position: "", interpretation: "", notes: "" },
  },
  // Step 6
  dfr: {
    dfrType: "",
    dfrHigh: "",
    dfrLow: "",
    dfrMid: "",
    q1Quality: "",
    highLowEqualsQ1: "",
    alignsWithBias: false,
    nearPriorPoi: false,
    notes: "",
  },
  // Step 7
  ssmt: {
    formed: "",
    ssmtType: "",
    locationType: "",
    locationPrice: "",
    timeframe: "",
    assetABehavior: "",
    assetBBehavior: "",
    assetCBehavior: "",
    strongAsset: "",
    weakAsset: "",
    alignsWithBias: "",
    randomSmtFlag: false,
    notes: "",
  },
  // Step 8
  confirmation: {
    confirmationType: "",
    timeframe: "",
    tfAlignmentValid: "",
    notes: "",
  },
  // Step 9
  entry: {
    entryModel: "",
    entryPrice: "",
    stopPrice: "",
    stopLogic: "",
    tp1: "",
    tp2: "",
    tp3: "",
    mainDol: "",
    riskPercent: "",
    riskUsd: "",
  },
  // Step 10
  goNoGoStatus: "",
  goNoGoReason: "",
  notes: "",
};

function completionForStep(step: number, data: PrepFormData): "complete" | "partial" | "empty" {
  switch (step) {
    case 1: return data.triad && data.primaryInstrument && data.session ? "complete" : data.triad || data.session ? "partial" : "empty";
    case 2: return data.htfBias && data.htfBiasExplanation ? "complete" : data.htfBias ? "partial" : "empty";
    case 3: return data.newsEvents.length > 0 ? "complete" : "empty";
    case 4: return data.activeCycleWeekly && data.activeCycleDaily ? "complete" : data.activeCycleWeekly ? "partial" : "empty";
    case 5: {
      const filled = Object.values(data.trueOpens).filter((v) => v.price).length;
      return filled >= 3 ? "complete" : filled > 0 ? "partial" : "empty";
    }
    case 6: return data.dfr.dfrHigh && data.dfr.dfrLow ? "complete" : data.dfr.dfrType ? "partial" : "empty";
    case 7: return data.ssmt.formed === "YES" && data.ssmt.ssmtType ? "complete" : data.ssmt.formed ? "partial" : "empty";
    case 8: return data.confirmation.confirmationType && data.confirmation.timeframe ? "complete" : data.confirmation.confirmationType ? "partial" : "empty";
    case 9: return data.entry.entryPrice && data.entry.stopPrice && data.entry.riskPercent ? "complete" : data.entry.entryModel ? "partial" : "empty";
    case 10: return data.goNoGoStatus ? "complete" : "empty";
    default: return "empty";
  }
}

function StepIcon({ status }: { status: "complete" | "partial" | "empty" }) {
  if (status === "complete") return <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />;
  if (status === "partial") return <AlertCircle size={14} style={{ color: "var(--color-warning)" }} />;
  return <Circle size={14} style={{ color: "var(--color-text-muted)" }} />;
}

export function PrepWizard({
  userId,
  calendarEvents = [],
  initialData,
  prepId,
}: {
  userId: string;
  calendarEvents?: CalendarEventItem[];
  initialData?: PrepFormData;
  prepId?: string;
}) {
  const [data, setData] = useState<PrepFormData>(initialData ?? EMPTY_FORM);
  const [open, setOpen] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update(partial: Partial<PrepFormData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function toggleStep(id: number) {
    setOpen((prev) => (prev === id ? 0 : id));
  }

  const totalScore = STEPS.filter((s) => s.required).reduce((acc, s) => {
    const status = completionForStep(s.id, data);
    return acc + (status === "complete" ? 1 : 0);
  }, 0);
  const requiredCount = STEPS.filter((s) => s.required).length;
  const pct = Math.round((totalScore / requiredCount) * 100);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (prepId) {
        await updateDailyPrep(prepId, userId, data);
      } else {
        await saveDailyPrep(userId, data);
      }
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="rounded-xl border p-4 mb-4 flex items-center gap-4"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            <span>Completion</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct === 100 ? "var(--color-success)" : "var(--color-accent)" }}
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || pct < 60}
          className="px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : prepId ? "Update" : "Save as Draft"}
        </button>
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      {/* Accordion steps */}
      {STEPS.map((step) => {
        const isOpen = open === step.id;
        const status = completionForStep(step.id, data);

        return (
          <div
            key={step.id}
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--color-bg-elevated)", borderColor: isOpen ? "var(--color-accent)" : "var(--color-bg-border)" }}
          >
            {/* Header */}
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
              style={{ background: isOpen ? "rgba(79,142,247,0.06)" : "transparent" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold w-5 text-center" style={{ color: "var(--color-text-muted)" }}>
                  {step.id}
                </span>
                <StepIcon status={status} />
                <span className="text-sm font-medium" style={{ color: isOpen ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                  {step.label}
                </span>
                {!step.required && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>
                    optional
                  </span>
                )}
              </div>
              {isOpen ? <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />}
            </button>

            {/* Body */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                {step.id === 1 && <Step1Market data={data} update={update} />}
                {step.id === 2 && <Step2Narrative data={data} update={update} />}
                {step.id === 3 && <Step3Calendar data={data} update={update} calendarEvents={calendarEvents} />}
                {step.id === 4 && <Step4Cycle data={data} update={update} />}
                {step.id === 5 && <Step5TrueOpens data={data} update={update} />}
                {step.id === 6 && <Step6DFR data={data} update={update} />}
                {step.id === 7 && <Step7SSMT data={data} update={update} />}
                {step.id === 8 && <Step8Confirmation data={data} update={update} />}
                {step.id === 9 && <Step9Entry data={data} update={update} />}
                {step.id === 10 && <Step10GoNoGo data={data} update={update} onSave={handleSave} saving={saving} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
