"use client";

import { useState, useTransition } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { updateBrokerTradeDetails } from "../actions";

const GAUGE_MIN = -1;
const GAUGE_MAX = 20;

function RGauge({ r }: { r: number | null }) {
  if (r == null) return null;
  const clamped = Math.min(Math.max(r, GAUGE_MIN), GAUGE_MAX);
  const pct = ((clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100;
  const color = r >= 0 ? "var(--color-success)" : "var(--color-danger)";

  return (
    <div className="space-y-2">
      <p className="text-2xl font-black" style={{ color }}>
        {r >= 0 ? "+" : ""}{r.toFixed(2)}R
      </p>
      <div className="relative h-2 rounded-full" style={{ background: "var(--color-bg-border)" }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
          style={{ left: `calc(${pct}% - 6px)`, background: color, borderColor: "var(--color-bg-elevated)" }}
        />
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
        <span>{GAUGE_MIN}</span>
        <span>0</span>
        <span>+{GAUGE_MAX}</span>
      </div>
    </div>
  );
}

export function TradeDetailForm({
  tradeId, netPnl, riskUsd, journalNote, chartUrl,
}: {
  tradeId: string;
  netPnl: number;
  riskUsd: number | null;
  journalNote: string | null;
  chartUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [risk, setRisk] = useState(riskUsd != null ? String(riskUsd) : "");
  const [note, setNote] = useState(journalNote ?? "");
  const [link, setLink] = useState(chartUrl ?? "");
  const [saved, setSaved] = useState(false);

  const riskNum = risk ? parseFloat(risk) : null;
  const r = riskNum && riskNum > 0 ? netPnl / riskNum : null;

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateBrokerTradeDetails(tradeId, {
        riskUsd: riskNum,
        journalNote: note || null,
        chartUrl: link || null,
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      {/* Risk / Reward */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Risk / Reward</h3>
        {r != null ? (
          <RGauge r={r} />
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Risk tutarını girin, R otomatik hesaplansın.</p>
        )}
        <div>
          <label className="step-label">Risk ($)</label>
          <input
            type="number"
            step="0.01"
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            placeholder="Ör: 200"
            className="field-input"
          />
        </div>
      </div>

      {/* Journal */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Journal</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Bu trade hakkında ne düşünüyorsun? Tıkla ve yaz…"
          className="field-input resize-none"
        />
      </div>

      {/* Chart link */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Chart Linki</h3>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="TradingView veya başka chart linki ekle"
          className="field-input"
        />
        {chartUrl && (
          <a href={chartUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-accent)" }}>
            <ExternalLink size={12} /> {chartUrl}
          </a>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          Kaydet
        </button>
        {saved && !pending && (
          <span className="text-xs" style={{ color: "var(--color-success)" }}>Kaydedildi ✓</span>
        )}
      </div>
    </div>
  );
}
