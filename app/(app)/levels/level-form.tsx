"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLevel } from "./actions";
import type { Level } from "@/app/generated/prisma/client";

const MARKET_GROUPS = ["INDICES", "FOREX", "CRYPTO"] as const;
const TIMEFRAMES    = ["MONTHLY", "WEEKLY", "DAILY", "H4", "H1", "M90", "M15", "M5", "M1"] as const;
const STATUSES      = ["ACTIVE", "INACTIVE", "REACHED"] as const;

const LEVEL_TYPES = [
  { group: "True Opens",   values: ["TYO","TMO","TWO","TDO","TSO","TMSO"] },
  { group: "Highs & Lows", values: ["PREV_HIGH","PREV_LOW","EQUAL_HIGHS","EQUAL_LOWS"] },
  { group: "DFR",          values: ["DFR_HIGH","DFR_LOW","DFR_MID","DFR_PROJECTION"] },
  { group: "POI",          values: ["FVG","OB","NWOG","NDOG"] },
  { group: "Custom",       values: ["CUSTOM_POI","CUSTOM_TOI"] },
] as const;

const TYPE_LABELS: Record<string, string> = {
  TYO: "TYO — True Year Open", TMO: "TMO — True Month Open",
  TWO: "TWO — True Week Open",  TDO: "TDO — True Day Open",
  TSO: "TSO — True Session Open", TMSO: "TMSO — True Midnight Open",
  PREV_HIGH: "Previous High", PREV_LOW: "Previous Low",
  EQUAL_HIGHS: "Equal Highs", EQUAL_LOWS: "Equal Lows",
  DFR_HIGH: "DFR High", DFR_LOW: "DFR Low", DFR_MID: "DFR Mid", DFR_PROJECTION: "DFR Projection",
  FVG: "FVG — Fair Value Gap", OB: "OB — Order Block",
  NWOG: "NWOG — New Week OG", NDOG: "NDOG — New Day OG",
  CUSTOM_POI: "Custom POI", CUSTOM_TOI: "Custom TOI",
};

interface Props { level?: Level | null }

export function LevelForm({ level }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(formRef.current!);
    startTransition(async () => {
      await saveLevel(level?.id ?? null, form);
      router.push("/levels");
    });
  }

  const field = "rounded-lg border px-3 py-2 text-sm w-full focus:outline-none focus:ring-1";
  const fieldStyle = {
    background: "var(--color-bg-surface)",
    borderColor: "var(--color-bg-border)",
    color: "var(--color-text-primary)",
  };
  const label = "block text-xs font-medium mb-1";
  const labelStyle = { color: "var(--color-text-muted)" };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1 — Instrument + Market Group */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} style={labelStyle}>Enstrüman</label>
          <input
            name="instrument"
            defaultValue={level?.instrument ?? "NQ"}
            required
            placeholder="NQ, ES, EUR/USD…"
            className={field}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className={label} style={labelStyle}>Market Grubu</label>
          <select name="marketGroup" defaultValue={level?.marketGroup ?? "INDICES"} required className={field} style={fieldStyle}>
            {MARKET_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 — Level Type + Timeframe */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} style={labelStyle}>Level Tipi</label>
          <select name="levelType" defaultValue={level?.levelType ?? "OB"} required className={field} style={fieldStyle}>
            {LEVEL_TYPES.map(({ group, values }) => (
              <optgroup key={group} label={group}>
                {values.map((v) => <option key={v} value={v}>{TYPE_LABELS[v] ?? v}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className={label} style={labelStyle}>Timeframe</label>
          <select name="timeframe" defaultValue={level?.timeframe ?? "H1"} required className={field} style={fieldStyle}>
            {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3 — Price + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} style={labelStyle}>Fiyat</label>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={level?.price ?? ""}
            required
            placeholder="19375.00"
            className={field}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className={label} style={labelStyle}>Durum</label>
          <select name="status" defaultValue={level?.status ?? "ACTIVE"} className={field} style={fieldStyle}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 4 — Valid From / To */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} style={labelStyle}>Geçerlilik Başlangıç (opsiyonel)</label>
          <input
            name="dateValidFrom"
            type="date"
            defaultValue={level?.dateValidFrom ? level.dateValidFrom.toISOString().slice(0, 10) : ""}
            className={field}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className={label} style={labelStyle}>Geçerlilik Bitiş (opsiyonel)</label>
          <input
            name="dateValidTo"
            type="date"
            defaultValue={level?.dateValidTo ? level.dateValidTo.toISOString().slice(0, 10) : ""}
            className={field}
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={label} style={labelStyle}>Notlar</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={level?.notes ?? ""}
          placeholder="Level hakkında notlarınız…"
          className={`${field} resize-none`}
          style={fieldStyle}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-border)" }}
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {pending ? "Kaydediliyor…" : level ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
