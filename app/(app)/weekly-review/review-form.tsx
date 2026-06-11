"use client";

import { useState } from "react";
import { saveWeeklyReview } from "./actions";
import type { WeeklyReview } from "@prisma/client";
import { CheckCircle } from "lucide-react";

const RATINGS = [1, 2, 3, 4, 5];
const RATING_LABELS: Record<number, string> = {
  1: "Çok kötü", 2: "Kötü", 3: "Orta", 4: "İyi", 5: "Harika",
};
const RATING_COLORS: Record<number, string> = {
  1: "#ef4444", 2: "#f97316", 3: "#f59e0b", 4: "#84cc16", 5: "#34c97e",
};

const FIELDS = [
  { key: "wentWell"   as const, label: "Bu hafta ne iyi gitti?",         placeholder: "Plana uyan trade'ler, iyi kararlar, güçlü yönler...",     color: "#34c97e" },
  { key: "toImprove"  as const, label: "Ne iyileştirilmeli?",            placeholder: "Hatalar, tekrarlayan sorunlar, kaçırılan fırsatlar...",    color: "#f59e0b" },
  { key: "nextFocus"  as const, label: "Gelecek hafta odak noktası",     placeholder: "Çalışılacak setup, geliştirilecek alışkanlık...",          color: "#6366f1" },
  { key: "commitment" as const, label: "Taahhüt & Niyet",                placeholder: "Gelecek haftaya dair sözüm...",                            color: "#a78bfa" },
];

export function ReviewForm({ weekStart, existing }: { weekStart: string; existing: WeeklyReview | null }) {
  const [form, setForm] = useState({
    wentWell:      existing?.wentWell      ?? "",
    toImprove:     existing?.toImprove     ?? "",
    nextFocus:     existing?.nextFocus     ?? "",
    commitment:    existing?.commitment    ?? "",
    overallRating: existing?.overallRating ?? null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function upd(k: keyof typeof form, v: string | number | null) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await saveWeeklyReview(weekStart, form);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kayıt hatası");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: "var(--color-bg-surface)",
    borderColor: "var(--color-bg-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-4">
      {/* Overall rating */}
      <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>Genel hafta puanı</p>
        <div className="flex gap-2">
          {RATINGS.map((r) => {
            const active = form.overallRating === r;
            const color = RATING_COLORS[r];
            return (
              <button key={r} type="button" onClick={() => upd("overallRating", active ? null : r)}
                className="flex-1 py-2 rounded-lg text-sm font-bold border transition-colors"
                style={{
                  background: active ? `${color}25` : "var(--color-bg-surface)",
                  borderColor: active ? color : "var(--color-bg-border)",
                  color: active ? color : "var(--color-text-muted)",
                }}
                title={RATING_LABELS[r]}>
                {r}
              </button>
            );
          })}
        </div>
        {form.overallRating && (
          <p className="text-xs mt-2 text-center font-medium"
            style={{ color: RATING_COLORS[form.overallRating] }}>
            {RATING_LABELS[form.overallRating]}
          </p>
        )}
      </div>

      {/* Text sections */}
      {FIELDS.map(({ key, label, placeholder, color }) => (
        <div key={key} className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <label className="text-xs font-semibold block mb-2" style={{ color }}>{label}</label>
          <textarea
            value={form[key] as string}
            onChange={(e) => upd(key, e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none leading-relaxed"
            style={inputStyle}
          />
        </div>
      ))}

      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>{error}</p>
      )}

      <button type="button" onClick={handleSave} disabled={saving}
        className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: saved ? "#34c97e" : "var(--color-accent)", color: "#fff" }}>
        {saved ? <><CheckCircle size={14} /> Kaydedildi</> : saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}
