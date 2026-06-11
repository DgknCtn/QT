"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Upload } from "lucide-react";
import { savePlaybook } from "./actions";
import { uploadScreenshot } from "@/lib/supabase/storage";
import type { PlaybookEntry } from "@prisma/client";

const CATEGORIES = ["REVERSAL", "SSMT", "DFR", "TRUE_OPEN", "CONTINUATION", "EXPANSION", "CUSTOM"];

const SECTION_META = [
  { key: "conditions"   as const, label: "Giriş Koşulları",   placeholder: "Ör: HTF bias yukarı yönlü",        color: "#34c97e" },
  { key: "management"   as const, label: "Trade Yönetimi",    placeholder: "Ör: Stop, True Open altına",         color: "#6366f1" },
  { key: "invalidation" as const, label: "İptal Koşulları",   placeholder: "Ör: SSMT divergence bozulursa",     color: "#ef4444" },
];

type FormState = {
  title: string;
  category: string;
  customCategory: string;
  description: string;
  conditions: string[];
  management: string[];
  invalidation: string[];
  notes: string;
  imageUrls: string[];
  isActive: boolean;
};

function toInitial(entry?: PlaybookEntry): FormState {
  if (!entry) return {
    title: "", category: "REVERSAL", customCategory: "",
    description: "", conditions: [""], management: [""], invalidation: [""],
    notes: "", imageUrls: [], isActive: true,
  };
  const knownCat = CATEGORIES.includes(entry.category);
  return {
    title: entry.title,
    category: knownCat ? entry.category : "CUSTOM",
    customCategory: knownCat ? "" : entry.category,
    description: entry.description ?? "",
    conditions: entry.conditions.length ? entry.conditions : [""],
    management: entry.management.length ? entry.management : [""],
    invalidation: entry.invalidation.length ? entry.invalidation : [""],
    notes: entry.notes ?? "",
    imageUrls: entry.imageUrls,
    isActive: entry.isActive,
  };
}

export function PlaybookForm({ entry, userId }: { entry?: PlaybookEntry; userId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toInitial(entry));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function upd<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function updateRule(section: "conditions" | "management" | "invalidation", idx: number, val: string) {
    setForm((f) => ({ ...f, [section]: f[section].map((r, i) => i === idx ? val : r) }));
  }
  function addRule(section: "conditions" | "management" | "invalidation") {
    setForm((f) => ({ ...f, [section]: [...f[section], ""] }));
  }
  function removeRule(section: "conditions" | "management" | "invalidation", idx: number) {
    setForm((f) => ({ ...f, [section]: f[section].filter((_, i) => i !== idx) }));
  }

  async function handleImageUpload(files: FileList) {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadScreenshot(file, userId);
        urls.push(url);
      }
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...urls] }));
    } catch {
      setError("Resim yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError("Başlık zorunlu"); return; }
    setSaving(true);
    setError("");
    try {
      const effectiveCategory = form.category === "CUSTOM" && form.customCategory.trim()
        ? form.customCategory.trim()
        : form.category;
      await savePlaybook(entry?.id ?? null, {
        title: form.title,
        category: effectiveCategory,
        description: form.description,
        conditions: form.conditions,
        management: form.management,
        invalidation: form.invalidation,
        notes: form.notes,
        imageUrls: form.imageUrls,
        isActive: form.isActive,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "NEXT_REDIRECT") setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none border";
  const inputStyle = { background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)", color: "var(--color-text-primary)" };

  return (
    <div className="space-y-5">
      {/* Basic info */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Başlık *</label>
            <input value={form.title} onChange={(e) => upd("title", e.target.value)}
              placeholder="Ör: True Open Rejection Long" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Kategori</label>
            <select value={form.category} onChange={(e) => upd("category", e.target.value)} className={inputCls} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {form.category === "CUSTOM" && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Özel Kategori Adı</label>
            <input value={form.customCategory} onChange={(e) => upd("customCategory", e.target.value)}
              placeholder="Kategori adı gir" className={inputCls} style={inputStyle} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Açıklama</label>
          <textarea value={form.description} onChange={(e) => upd("description", e.target.value)}
            rows={2} placeholder="Setup'ı kısaca açıkla" className={`${inputCls} resize-none`} style={inputStyle} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => upd("isActive", e.target.checked)}
            className="rounded" />
          <label htmlFor="isActive" className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Aktif setup (aktif değilse gri gösterilir)</label>
        </div>
      </div>

      {/* Rule sections */}
      {SECTION_META.map(({ key, label, placeholder, color }) => (
        <div key={key} className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{label}</h3>
            <button type="button" onClick={() => addRule(key)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
              style={{ background: `${color}18`, color }}>
              <Plus size={11} /> Ekle
            </button>
          </div>
          <div className="space-y-2">
            {form[key].map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold w-4 shrink-0 text-right" style={{ color }}>{i + 1}.</span>
                <input value={rule} onChange={(e) => updateRule(key, i, e.target.value)}
                  placeholder={placeholder} className={`${inputCls} flex-1`} style={inputStyle} />
                {form[key].length > 1 && (
                  <button type="button" onClick={() => removeRule(key, i)}
                    className="shrink-0 p-1 rounded" style={{ color: "var(--color-text-muted)" }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Notes */}
      <div className="rounded-xl border p-5" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <label className="text-xs font-medium block mb-2" style={{ color: "var(--color-text-muted)" }}>Notlar</label>
        <textarea value={form.notes} onChange={(e) => upd("notes", e.target.value)}
          rows={3} placeholder="Ek notlar, bağlam bilgisi..." className={`${inputCls} resize-none`} style={inputStyle} />
      </div>

      {/* Screenshots */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Örnek Görseller</h3>
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg disabled:opacity-50"
            style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-bg-border)" }}>
            <Upload size={11} /> {uploading ? "Yükleniyor…" : "Görsel Ekle"}
          </button>
        </div>
        {form.imageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {form.imageUrls.map((url, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden group" style={{ aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, j) => j !== i) }))}
                  className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "var(--color-danger)", color: "#fff" }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files) handleImageUpload(e.target.files); e.target.value = ""; }} />
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>{error}</p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={saving || uploading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--color-accent)", color: "#fff" }}>
          {saving ? "Kaydediliyor…" : entry ? "Güncelle" : "Kaydet"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl text-sm border"
          style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)" }}>
          İptal
        </button>
      </div>
    </div>
  );
}
