"use client";

import { useTransition, useState } from "react";
import { saveGoal } from "./actions";

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

interface Props {
  defaultYear: number;
  defaultMonth: number;
  existing?: {
    id: string;
    targetR: number | null;
    targetWinRate: number | null;
    targetTrades: number | null;
    notes: string | null;
  } | null;
}

export function GoalForm({ defaultYear, defaultMonth, existing }: Props) {
  const [pending, startTransition] = useTransition();
  const [year,  setYear]  = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);

  const now = new Date();
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const inputStyle = {
    background: "var(--color-bg-surface)",
    border: "1px solid var(--color-bg-border)",
    borderRadius: 8,
    color: "var(--color-text-primary)",
    fontSize: 13,
    padding: "8px 12px",
    width: "100%",
    outline: "none",
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveGoal(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Period selector */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Yıl</label>
          <select name="year" value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ ...inputStyle, cursor: "pointer" }}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Ay</label>
          <select name="month" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ ...inputStyle, cursor: "pointer" }}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Targets */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Hedef R</label>
          <input
            type="number" step="0.1" name="targetR"
            defaultValue={existing?.targetR ?? ""}
            placeholder="örn. 10"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Hedef Win Rate %</label>
          <input
            type="number" step="1" min="0" max="100" name="targetWinRate"
            defaultValue={existing?.targetWinRate ?? ""}
            placeholder="örn. 60"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Hedef Trade Sayısı</label>
          <input
            type="number" step="1" min="1" name="targetTrades"
            defaultValue={existing?.targetTrades ?? ""}
            placeholder="örn. 20"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Notlar (opsiyonel)</label>
        <textarea
          name="notes"
          defaultValue={existing?.notes ?? ""}
          placeholder="Bu ay için odak noktaları, kurallar..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg text-sm font-medium"
        style={{ background: "var(--color-accent)", color: "#fff", opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "Kaydediliyor..." : "Hedefi Kaydet"}
      </button>
    </form>
  );
}
