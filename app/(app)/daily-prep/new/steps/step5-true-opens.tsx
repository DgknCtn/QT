"use client";

import { Bookmark, RotateCcw } from "lucide-react";
import Link from "next/link";
import { AutoFilledHint } from "@/components/ui-kit/auto-filled-hint";
import { deriveTrueOpen, toleranceFor, parsePrice } from "@/lib/prep/true-open";
import type { TrueOpenLevel } from "../actions";
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

type Props = {
  data: PrepFormData;
  update: (p: Partial<PrepFormData>) => void;
  /** Kullanıcının kayıtlı True Open seviyeleri, enstrümana göre gruplu. */
  trueOpenLevels?: Record<string, TrueOpenLevel[]>;
};

export function Step5TrueOpens({ data, update, trueOpenLevels = {} }: Props) {
  const instrument = data.primaryInstrument;
  const levels = instrument ? trueOpenLevels[instrument.toUpperCase()] ?? [] : [];
  const levelByType = new Map(levels.map((l) => [l.levelType, l]));
  const tolerance = toleranceFor(instrument);

  /**
   * Anlık fiyata göre elle dokunulmamış satırların konum/yorumunu yeniden
   * hesaplar. `manual: true` olan satırlar korunur.
   */
  function recompute(
    trueOpens: Record<string, TrueOpenEntry>,
    currentPriceRaw: string,
  ): Record<string, TrueOpenEntry> {
    const current = parsePrice(currentPriceRaw);
    if (current == null) return trueOpens;

    const next: Record<string, TrueOpenEntry> = {};
    for (const [key, entry] of Object.entries(trueOpens)) {
      const open = parsePrice(entry.price);
      if (entry.manual || open == null) {
        next[key] = entry;
        continue;
      }
      next[key] = { ...entry, ...deriveTrueOpen(current, open, tolerance) };
    }
    return next;
  }

  function setCurrentPrice(value: string) {
    update({ currentPrice: value, trueOpens: recompute(data.trueOpens, value) });
  }

  function updateTO(key: string, field: keyof TrueOpenEntry, value: string) {
    const entry = { ...data.trueOpens[key], [field]: value };
    // Konumu/yorumu elle seçmek satırı otomatik türetmeden çıkarır.
    if (field === "position" || field === "interpretation") entry.manual = true;

    const nextOpens = { ...data.trueOpens, [key]: entry };
    // Fiyat değiştiyse bu satırın türetimi tazelensin.
    update({ trueOpens: field === "price" ? recompute(nextOpens, data.currentPrice) : nextOpens });
  }

  /** Satırı yeniden otomatik türetime döndürür. */
  function resetToAuto(key: string) {
    const entry = { ...data.trueOpens[key] };
    delete entry.manual;
    update({ trueOpens: recompute({ ...data.trueOpens, [key]: entry }, data.currentPrice) });
  }

  /** Kayıtlı seviyelerden yalnızca BOŞ fiyat hücrelerini doldurur. */
  function fillFromLevels() {
    const next = { ...data.trueOpens };
    const filled: string[] = [];
    for (const { key } of TRUE_OPENS) {
      const level = levelByType.get(key);
      if (!level || next[key]?.price) continue;
      next[key] = { ...next[key], price: String(level.price) };
      filled.push(`level:trueOpen:${key}`);
    }
    if (filled.length === 0) return;
    update({
      trueOpens: recompute(next, data.currentPrice),
      autoFilled: [...new Set([...data.autoFilled, ...filled])],
    });
  }

  // Adım 10 tüm satırlar aynı yöndeyken sert blok üretir; buradaki satır ipucu
  // yalnızca bilgilendirir ve o semantiğe uyar.
  const filledEntries = Object.values(data.trueOpens).filter(
    (t) => t.price && (t.position === "ABOVE" || t.position === "BELOW"),
  );
  const allAbove = filledEntries.length > 0 && filledEntries.every((t) => t.position === "ABOVE");
  const allBelow = filledEntries.length > 0 && filledEntries.every((t) => t.position === "BELOW");
  const biasConflict =
    (data.htfBias === "LONG" && allAbove) || (data.htfBias === "SHORT" && allBelow);

  const availableLevelCount = TRUE_OPENS.filter(
    ({ key }) => levelByType.has(key) && !data.trueOpens[key]?.price,
  ).length;

  return (
    <div className="space-y-3 pt-3">
      {/* Anlık fiyat: tek giriş, altı satırın konum + yorumunu türetir. */}
      <div
        className="rounded-lg border p-3 space-y-2"
        style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Şu anki fiyat
          </label>
          <input
            type="number"
            step="0.01"
            value={data.currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder={instrument ? `${instrument} fiyatı` : "Fiyat"}
            className="field-input w-36"
          />
          <button
            type="button"
            onClick={fillFromLevels}
            disabled={availableLevelCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ml-auto disabled:opacity-40"
            style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-secondary)" }}
          >
            <Bookmark size={11} /> Kayıtlı seviyelerden doldur
            {availableLevelCount > 0 && ` (${availableLevelCount})`}
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {data.currentPrice
            ? "Konum ve premium/discount yorumu bu fiyattan türetiliyor. Bir satırı elle değiştirirsen o satır sabit kalır."
            : "Fiyatı bir kez gir; her True Open için konum ve premium/discount otomatik hesaplanır."}
        </p>
        {levels.length === 0 && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {instrument ? `${instrument} için kayıtlı True Open seviyesi yok.` : "Önce Adım 1'de enstrüman seç."}{" "}
            <Link href="/levels/new" className="underline">
              Seviye ekle
            </Link>
          </p>
        )}
      </div>

      {biasConflict && (
        <p
          className="text-xs rounded-lg px-3 py-2"
          style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning)" }}
        >
          ⚠ {data.htfBias === "LONG" ? "Long" : "Short"} fikri {allAbove ? "premium" : "discount"} bağlamla
          çelişiyor — fiyat tüm True Open&apos;ların {allAbove ? "üstünde" : "altında"}. Adım 10&apos;da sert blok
          olarak çıkacak.
        </p>
      )}

      {TRUE_OPENS.map(({ key, label, sub, tf }) => {
        const to = data.trueOpens[key] || { price: "", position: "", interpretation: "", notes: "" };
        const fromLevel = data.autoFilled.includes(`level:trueOpen:${key}`);
        const derived = Boolean(to.price && data.currentPrice && !to.manual);

        return (
          <div
            key={key}
            className="rounded-lg border p-3 space-y-2"
            style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-10" style={{ color: "var(--color-accent)" }}>{label}</span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{sub}</span>
              {fromLevel && <AutoFilledHint source="level" title="Kayıtlı seviyeden alındı" />}
              {to.manual && (
                <button
                  type="button"
                  onClick={() => resetToAuto(key)}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                  title="Bu satırı yeniden fiyattan türet"
                >
                  <RotateCcw size={10} /> otomatiğe dön
                </button>
              )}
              <span className="text-xs px-1.5 py-0.5 rounded ml-auto" style={{ background: "var(--color-bg-border)", color: "var(--color-text-muted)" }}>
                {tf}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.01"
                value={to.price}
                onChange={(e) => updateTO(key, "price", e.target.value)}
                placeholder="Price"
                className="field-input"
              />

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
                      // Türetilen satırlar hafif soluk: değer var ama kullanıcı seçmedi.
                      opacity: derived && to.position !== p ? 0.6 : 1,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

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
          </div>
        );
      })}
    </div>
  );
}
