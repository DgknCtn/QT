"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { saveTrade } from "./actions";
import { updateTrade } from "@/app/(app)/journal/[id]/actions";
import { uploadScreenshot } from "@/lib/supabase/storage";
import { format } from "date-fns";

const MISTAKE_TAGS = [
  "FOMO", "Late entry", "Early entry", "No HTF narrative", "No SSMT",
  "Random SMT", "Wrong TF alignment", "Ignored True Open", "Ignored DFR",
  "Bad stop", "TP not planned", "News ignored", "Oversized risk",
  "Revenge trade", "Entered chop", "No confirmation", "Exited early", "Moved stop",
];
const POSITIVE_TAGS = [
  "Clean narrative", "Correct TO context", "Good patience", "High quality SSMT",
  "Strong confirmation", "Good DFR target", "Good partial", "Protected capital",
  "Followed no-trade rule", "Good BE management",
];

type Prep = { id: string; date: Date; triad: string; htfBias: string; goNoGoStatus: string | null };
type ScreenshotEntry = { file: File; preview: string; type: string };

type InitialData = {
  date: string;
  instrument: string;
  marketGroup: string;
  triad: string;
  session: string;
  direction: string;
  setupType: string;
  entryModel: string;
  entryPrice: string;
  stopPrice: string;
  tp1: string; tp2: string; tp3: string;
  riskPercent: string;
  rResult: string;
  pnlPoints: string;
  pnlCurrency: string;
  result: string;
  dailyPrepId: string;
  planFollowed: string;
  goStatusAtEntry: string;
  notes: string;
  mistakeTags: string[];
  positiveTags: string[];
};

const SCREENSHOT_TYPES = ["HTF_CONTEXT", "ENTRY", "EXIT", "MISSED_SETUP", "REVIEW"];
const SCREENSHOT_LABELS: Record<string, string> = {
  HTF_CONTEXT: "HTF Context", ENTRY: "Entry", EXIT: "Exit",
  MISSED_SETUP: "Missed Setup", REVIEW: "Review",
};

export function TradeForm({
  userId,
  recentPreps,
  initialData,
  tradeId,
}: {
  userId: string;
  recentPreps: Prep[];
  initialData?: InitialData;
  tradeId?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"quick" | "full">(initialData ? "full" : "quick");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [screenshots, setScreenshots] = useState<ScreenshotEntry[]>([]);

  const [form, setForm] = useState(initialData ?? {
    date: format(new Date(), "yyyy-MM-dd"),
    instrument: "",
    marketGroup: "",
    triad: "",
    session: "",
    direction: "",
    setupType: "",
    entryModel: "",
    entryPrice: "",
    stopPrice: "",
    tp1: "", tp2: "", tp3: "",
    riskPercent: "",
    rResult: "",
    pnlPoints: "",
    pnlCurrency: "",
    result: "",
    dailyPrepId: "",
    planFollowed: "",
    goStatusAtEntry: "",
    notes: "",
    processGrade: "",
    mistakeTags: [] as string[],
    positiveTags: [] as string[],
  });

  function upd(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTag(type: "mistakeTags" | "positiveTags", tag: string) {
    setForm((f) => {
      const arr = f[type] as string[];
      return { ...f, [type]: arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag] };
    });
  }

  async function addScreenshot(file: File, type: string) {
    const preview = URL.createObjectURL(file);
    setScreenshots((s) => [...s, { file, preview, type }]);
  }

  function removeScreenshot(idx: number) {
    setScreenshots((s) => s.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!form.instrument || !form.direction || !form.result) {
      setError("Instrument, direction and result are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const uploadedUrls: { url: string; type: string }[] = [];
      for (const sc of screenshots) {
        const url = await uploadScreenshot(sc.file, userId);
        uploadedUrls.push({ url, type: sc.type });
      }
      if (tradeId) {
        await updateTrade(tradeId, userId, form, uploadedUrls);
        router.push(`/journal/${tradeId}`);
      } else {
        await saveTrade(userId, form, uploadedUrls);
        router.push("/journal");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-bg-border)" }}>
        {(["quick", "full"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{
              background: mode === m ? "var(--color-accent)" : "var(--color-bg-surface)",
              color: mode === m ? "#fff" : "var(--color-text-muted)",
            }}
          >
            {m === "quick" ? "Quick Add" : "Full Review"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        {/* ── Core fields (both modes) ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="step-label">Date</label>
            <input type="date" value={form.date} onChange={(e) => upd("date", e.target.value)} className="field-input" />
          </div>
          <div>
            <label className="step-label">Instrument <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <input type="text" value={form.instrument} onChange={(e) => upd("instrument", e.target.value)} placeholder="NQ, ES, EUR/USD…" className="field-input" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="step-label">Direction <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <div className="flex gap-2">
              {["LONG", "SHORT"].map((d) => (
                <button key={d} type="button" onClick={() => upd("direction", d)}
                  className="flex-1 py-2 rounded-lg border text-sm font-bold transition-colors"
                  style={{
                    background: form.direction === d ? (d === "LONG" ? "rgba(52,201,126,0.2)" : "rgba(239,68,68,0.2)") : "var(--color-bg-surface)",
                    borderColor: form.direction === d ? (d === "LONG" ? "var(--color-long)" : "var(--color-short)") : "var(--color-bg-border)",
                    color: form.direction === d ? (d === "LONG" ? "var(--color-long)" : "var(--color-short)") : "var(--color-text-muted)",
                  }}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="step-label">Session</label>
            <select value={form.session} onChange={(e) => upd("session", e.target.value)} className="field-input">
              <option value="">—</option>
              {["LONDON", "NY_AM", "NY_PM", "ASIA"].map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="step-label">Triad</label>
            <select value={form.triad} onChange={(e) => upd("triad", e.target.value)} className="field-input">
              <option value="">—</option>
              <option value="NQ_ES_YM">NQ / ES / YM</option>
              <option value="EU_GU_DXY">EU / GU / DXY</option>
              <option value="BTC_ETH_TOTAL3">BTC / ETH / TOTAL3</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="step-label">Setup Type</label>
            <select value={form.setupType} onChange={(e) => upd("setupType", e.target.value)} className="field-input">
              <option value="">—</option>
              {["REVERSAL", "CONTINUATION", "EXPANSION", "RETRACEMENT", "MISSED", "CUSTOM"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="step-label">Result <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {["WIN", "LOSS", "BE", "PARTIAL", "MISSED", "NO_TRADE"].map((r) => {
                const colors: Record<string, string> = { WIN: "var(--color-success)", LOSS: "var(--color-danger)", BE: "var(--color-warning)", PARTIAL: "var(--color-accent)" };
                const c = colors[r] ?? "var(--color-text-muted)";
                return (
                  <button key={r} type="button" onClick={() => upd("result", r)}
                    className="px-2.5 py-1 rounded-md border text-xs font-bold transition-colors"
                    style={{
                      background: form.result === r ? `${c}22` : "var(--color-bg-surface)",
                      borderColor: form.result === r ? c : "var(--color-bg-border)",
                      color: form.result === r ? c : "var(--color-text-muted)",
                    }}>{r}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: "entryPrice", label: "Entry" },
            { key: "stopPrice",  label: "Stop" },
            { key: "tp1",        label: "TP1" },
            { key: "riskPercent",label: "Risk %" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="step-label">{label}</label>
              <input type="number" step="0.01" value={form[key as keyof typeof form] as string}
                onChange={(e) => upd(key, e.target.value)} placeholder="—" className="field-input" />
            </div>
          ))}
        </div>

        {/* R result */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="step-label">R Result</label>
            <input type="number" step="0.1" value={form.rResult} onChange={(e) => upd("rResult", e.target.value)} placeholder="e.g. 2.0 or -1.0" className="field-input" />
          </div>
          <div>
            <label className="step-label">PnL Points</label>
            <input type="number" step="0.25" value={form.pnlPoints} onChange={(e) => upd("pnlPoints", e.target.value)} placeholder="—" className="field-input" />
          </div>
          <div>
            <label className="step-label">PnL ($)</label>
            <input type="number" step="0.01" value={form.pnlCurrency} onChange={(e) => upd("pnlCurrency", e.target.value)} placeholder="e.g. 250 or -120" className="field-input" />
          </div>
          <div>
            <label className="step-label">Link to Daily Prep</label>
            <select value={form.dailyPrepId} onChange={(e) => upd("dailyPrepId", e.target.value)} className="field-input">
              <option value="">— None —</option>
              {recentPreps.map((p) => (
                <option key={p.id} value={p.id}>
                  {format(new Date(p.date), "MMM d")} · {p.triad?.replace(/_/g, "/")} · {p.htfBias}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Full review fields ── */}
        {mode === "full" && (
          <>
            <div className="pt-3 border-t space-y-4" style={{ borderColor: "var(--color-bg-border)" }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="step-label">Plan Followed?</label>
                  <div className="flex gap-1.5">
                    {["YES", "PARTIAL", "NO"].map((v) => (
                      <button key={v} type="button" onClick={() => upd("planFollowed", v)}
                        className="flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                        style={{
                          background: form.planFollowed === v ? "var(--color-accent)" : "var(--color-bg-surface)",
                          borderColor: form.planFollowed === v ? "var(--color-accent)" : "var(--color-bg-border)",
                          color: form.planFollowed === v ? "#fff" : "var(--color-text-muted)",
                        }}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="step-label">GO Status at Entry</label>
                  <select value={form.goStatusAtEntry} onChange={(e) => upd("goStatusAtEntry", e.target.value)} className="field-input">
                    <option value="">—</option>
                    <option value="GO">GO</option>
                    <option value="NO_GO_BUT_ENTERED">NO-GO but entered</option>
                    <option value="WAIT_BUT_ENTERED">WAIT but entered</option>
                    <option value="NO_CHECKLIST">No checklist</option>
                  </select>
                </div>
              </div>

              {/* Mistake tags */}
              <div>
                <label className="step-label">Mistake Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {MISTAKE_TAGS.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag("mistakeTags", t)}
                      className="px-2 py-1 rounded text-xs border transition-colors"
                      style={{
                        background: form.mistakeTags.includes(t) ? "rgba(239,68,68,0.15)" : "var(--color-bg-surface)",
                        borderColor: form.mistakeTags.includes(t) ? "var(--color-danger)" : "var(--color-bg-border)",
                        color: form.mistakeTags.includes(t) ? "var(--color-danger)" : "var(--color-text-muted)",
                      }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Positive tags */}
              <div>
                <label className="step-label">Positive Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {POSITIVE_TAGS.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag("positiveTags", t)}
                      className="px-2 py-1 rounded text-xs border transition-colors"
                      style={{
                        background: form.positiveTags.includes(t) ? "rgba(52,201,126,0.15)" : "var(--color-bg-surface)",
                        borderColor: form.positiveTags.includes(t) ? "var(--color-success)" : "var(--color-bg-border)",
                        color: form.positiveTags.includes(t) ? "var(--color-success)" : "var(--color-text-muted)",
                      }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label className="step-label">Screenshots</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {screenshots.map((sc, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border group"
                      style={{ borderColor: "var(--color-bg-border)", aspectRatio: "16/9" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sc.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <select value={sc.type}
                          onChange={(e) => setScreenshots((s) => s.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                          className="text-xs rounded px-1 py-0.5"
                          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)", border: "none" }}
                          onClick={(e) => e.preventDefault()}
                        >
                          {SCREENSHOT_TYPES.map((t) => <option key={t} value={t}>{SCREENSHOT_LABELS[t]}</option>)}
                        </select>
                        <button type="button" onClick={() => removeScreenshot(i)}
                          className="p-1 rounded-full" style={{ background: "var(--color-danger)", color: "#fff" }}>
                          <X size={12} />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                        {SCREENSHOT_LABELS[sc.type]}
                      </span>
                    </div>
                  ))}

                  {/* Upload button */}
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
                    style={{ borderColor: "var(--color-bg-border)", aspectRatio: "16/9", color: "var(--color-text-muted)" }}>
                    <Upload size={20} />
                    <span className="text-xs">Add screenshot</span>
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    Array.from(e.target.files ?? []).forEach((f) => addScreenshot(f, "ENTRY"));
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <div>
          <label className="step-label">Notes / Reflection</label>
          <textarea value={form.notes} onChange={(e) => upd("notes", e.target.value)} rows={3}
            placeholder="What happened? What did you learn? What would you do differently?"
            className="field-input resize-none" />
        </div>
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>{error}</p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
          style={{ background: "var(--color-accent)", color: "#fff" }}>
          {saving ? "Saving…" : tradeId ? "Güncelle" : "Save Trade"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl text-sm border transition-colors"
          style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
