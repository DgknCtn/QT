"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle, Clock, RotateCcw, Trash2 } from "lucide-react";
import { useIsHydrated } from "@/lib/use-stored-value";
import { usePrepDraft, prepDraftKey } from "@/lib/use-prep-draft";
import { computePrepAutoFill, describeAutoFill, type PrepAutoFill } from "@/lib/prep/clock-autofill";
import { applyCarryOver, carriedFieldKeys, type PrepCarryOver } from "@/lib/prep/carry-over";
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
import { saveDailyPrep, updateDailyPrep, type CalendarEventItem, type TrueOpenLevel } from "./actions";
import { createEmptyPrepForm, type PrepFormData } from "./types";

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

/** Kopyalanan alanların rozet anahtarları — saatten gelenlerden ayırt edilir. */
function carryKeys(carry: PrepCarryOver): string[] {
  return carriedFieldKeys(carry).map((key) => `carry:${key}`);
}

function StepIcon({ status }: { status: "complete" | "partial" | "empty" }) {
  if (status === "complete") return <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />;
  if (status === "partial") return <AlertCircle size={14} style={{ color: "var(--color-warning)" }} />;
  return <Circle size={14} style={{ color: "var(--color-text-muted)" }} />;
}

export function PrepWizard({
  calendarEvents = [],
  initialData,
  prepId,
  carryOver = null,
  applyCarryOverOnLoad = false,
  trueOpenLevels = {},
}: {
  calendarEvents?: CalendarEventItem[];
  initialData?: PrepFormData;
  prepId?: string;
  carryOver?: PrepCarryOver | null;
  applyCarryOverOnLoad?: boolean;
  trueOpenLevels?: Record<string, TrueOpenLevel[]>;
}) {
  const isEdit = Boolean(prepId);

  const [data, setData] = useState<PrepFormData>(() => {
    if (initialData) return initialData;
    const empty = createEmptyPrepForm();
    // `?from=last` ile gelindiyse alanlar daha ilk render'da dolu gelsin.
    if (applyCarryOverOnLoad && carryOver) {
      return { ...applyCarryOver(empty, carryOver), autoFilled: carryKeys(carryOver) };
    }
    return empty;
  });
  const [open, setOpen] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ── Taslak ────────────────────────────────────────────────────────────────
  const hydrated = useIsHydrated();
  const draftKey = prepDraftKey(prepId);
  const { draft, save: saveDraft, clear: clearDraft, dismiss: dismissDraft } = usePrepDraft(draftKey);
  const [draftHandled, setDraftHandled] = useState(false);
  const skipFirstAutosave = useRef(true);

  useEffect(() => {
    // İlk render'da yazma: dokunulmamış boş formdan hayalet taslak oluşmasın.
    if (skipFirstAutosave.current) {
      skipFirstAutosave.current = false;
      return;
    }
    saveDraft(data);
  }, [data, saveDraft]);

  function restoreDraft() {
    if (draft) setData(draft.data);
    setDraftHandled(true);
  }

  function ignoreDraft() {
    dismissDraft();
    setDraftHandled(true);
  }

  // ── Market saatinden doldurma ─────────────────────────────────────────────
  //
  // Efekt içinde setState YOK (repo kuralı: react-hooks/set-state-in-effect).
  // Saatin önerisi render sırasında türetilir ve forma "boş alanın varsayılanı"
  // olarak uygulanır. Kullanıcı bir alana kendi değerini yazdığı anda kendi
  // değeri kazanır; "Temizle" ise öneriyi tamamen kapatır.
  const [suggestionsOff, setSuggestionsOff] = useState(false);

  // Mount'ta bir kez hesaplanır (her render'da hesaplansa dakika değiştikçe
  // zıplardı). Sunucuda `null`; `hydrated` kapısı sayesinde hidrasyon render'ı
  // da öneriyi kullanmaz, yani sunucu markup'ıyla çakışma olmaz.
  const [clockSuggestion] = useState<PrepAutoFill | null>(() =>
    typeof window === "undefined" ? null : computePrepAutoFill(new Date()),
  );
  const suggestion =
    !hydrated || isEdit || suggestionsOff || (draft && !draftHandled) ? null : clockSuggestion;
  const clockFill = suggestion && !suggestion.marketClosed ? suggestion : null;

  /** Kullanıcının yazdığı değer + saatin önerisi (boş alanlar için). */
  const effectiveData: PrepFormData = clockFill
    ? {
        ...data,
        session: data.session || clockFill.session || "",
        activeCycleWeekly: data.activeCycleWeekly || clockFill.activeCycleWeekly || "",
        activeCycleDaily: data.activeCycleDaily || clockFill.activeCycleDaily || "",
        active90mCycle: data.active90mCycle || clockFill.active90mCycle || "",
        activeMicroCycle: data.activeMicroCycle || clockFill.activeMicroCycle || "",
        autoFilled: [
          ...data.autoFilled,
          // Yalnızca gerçekten saatten gelen alanlar rozet alır.
          ...(["session", "activeCycleWeekly", "activeCycleDaily", "active90mCycle", "activeMicroCycle"] as const).filter(
            (key) => !data[key] && clockFill[key],
          ),
        ],
      }
    : data;

  const autoFillSummary = clockFill ? describeAutoFill(clockFill) : null;
  const autoFillNote = suggestion?.marketClosed ? suggestion.note : null;

  /** Adım 1'deki "Son prep'ten doldur" — navigasyonsuz. */
  function applyCarryOverNow() {
    if (!carryOver) return;
    setData((prev) => ({
      ...applyCarryOver(prev, carryOver),
      autoFilled: [...new Set([...prev.autoFilled, ...carryKeys(carryOver)])],
    }));
  }

  function update(partial: Partial<PrepFormData>) {
    setData((prev) => ({
      ...prev,
      ...partial,
      // Kullanıcı bir alana dokunduğu anda o alanın rozeti düşer (önekli
      // anahtarlar dahil). Adım 5 gibi rozetini kendi yöneten adımlar
      // autoFilled'ı açıkça geçirir; o zaman verdiği liste korunur.
      autoFilled:
        partial.autoFilled ??
        prev.autoFilled.filter((key) => !(key.replace(/^(carry|level):/, "") in partial)),
    }));
  }

  function toggleStep(id: number) {
    setOpen((prev) => (prev === id ? 0 : id));
  }

  const totalScore = STEPS.filter((s) => s.required).reduce((acc, s) => {
    const status = completionForStep(s.id, effectiveData);
    return acc + (status === "complete" ? 1 : 0);
  }, 0);
  const requiredCount = STEPS.filter((s) => s.required).length;
  const pct = Math.round((totalScore / requiredCount) * 100);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (prepId) {
        await updateDailyPrep(prepId, effectiveData);
      } else {
        await saveDailyPrep(effectiveData);
      }
      // Kalıcı kayıt başarılı: taslak artık gereksiz, dönüşte sorulmasın.
      clearDraft();
      setDraftHandled(true);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const draftSavedAt = draft
    ? new Date(draft.savedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-2">
      {/* Kurtarılabilir taslak. Yalnızca hidrasyondan sonra render edilir ki
          sunucu markup'ıyla çakışmasın. */}
      {hydrated && draft && !draftHandled && (
        <div
          className="rounded-xl border px-4 py-3 mb-2 flex items-center gap-3 flex-wrap"
          style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)" }}
        >
          <RotateCcw size={14} style={{ color: "var(--color-warning)" }} />
          <p className="text-xs flex-1" style={{ color: "var(--color-text-secondary)" }}>
            Kaydedilmemiş taslak bulundu ({draftSavedAt}).
          </p>
          <button
            onClick={restoreDraft}
            className="px-3 py-1 rounded-lg text-xs font-medium"
            style={{ background: "var(--color-warning)", color: "#fff" }}
          >
            Geri yükle
          </button>
          <button
            onClick={ignoreDraft}
            className="px-3 py-1 rounded-lg text-xs font-medium border"
            style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)" }}
          >
            Yoksay
          </button>
        </div>
      )}

      {/* Market saatinden doldurma özeti */}
      {autoFillSummary && (
        <div
          className="rounded-xl border px-4 py-2.5 mb-2 flex items-center gap-3 flex-wrap"
          style={{ background: "rgba(79,142,247,0.06)", borderColor: "rgba(79,142,247,0.3)" }}
        >
          <Clock size={14} style={{ color: "var(--color-accent)" }} />
          <p className="text-xs flex-1" style={{ color: "var(--color-text-secondary)" }}>
            Market saatinden dolduruldu: {autoFillSummary}
          </p>
          <button onClick={() => setSuggestionsOff(true)} className="text-xs" style={{ color: "var(--color-accent)" }}>
            Temizle
          </button>
        </div>
      )}

      {/* Market kapalı notu */}
      {autoFillNote && (
        <div
          className="rounded-xl border px-4 py-2.5 mb-2 flex items-center gap-3"
          style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}
        >
          <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{autoFillNote}</p>
        </div>
      )}

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
        <div className="flex items-center gap-2">
          {hydrated && draft && draftHandled && (
            <button
              onClick={clearDraft}
              title="Kayıtlı taslağı sil"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || pct < 60}
            title={pct < 60 ? "Kaydetmek için zorunlu adımların en az %60'ı tamamlanmalı" : undefined}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : prepId ? "Update" : "Save as Draft"}
          </button>
        </div>
      </div>

      {/* Kaydetme kilidi neden kapalı — eskiden hiçbir açıklama yoktu. */}
      {pct < 60 && (
        <p className="text-xs -mt-2 mb-2" style={{ color: "var(--color-text-muted)" }}>
          Kaydetmek için zorunlu adımların en az %60&apos;ı tamamlanmalı (şu an %{pct}).
        </p>
      )}

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
                {step.id === 1 && <Step1Market data={effectiveData} update={update} onApplyCarryOver={carryOver && !isEdit ? applyCarryOverNow : undefined} />}
                {step.id === 2 && <Step2Narrative data={effectiveData} update={update} />}
                {step.id === 3 && <Step3Calendar data={effectiveData} update={update} calendarEvents={calendarEvents} />}
                {step.id === 4 && <Step4Cycle data={effectiveData} update={update} />}
                {step.id === 5 && <Step5TrueOpens data={effectiveData} update={update} trueOpenLevels={trueOpenLevels} />}
                {step.id === 6 && <Step6DFR data={effectiveData} update={update} />}
                {step.id === 7 && <Step7SSMT data={effectiveData} update={update} />}
                {step.id === 8 && <Step8Confirmation data={effectiveData} update={update} />}
                {step.id === 9 && <Step9Entry data={effectiveData} update={update} />}
                {step.id === 10 && <Step10GoNoGo data={effectiveData} update={update} onSave={handleSave} saving={saving} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
