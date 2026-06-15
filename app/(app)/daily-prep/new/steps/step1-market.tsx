"use client";

import type { PrepFormData } from "../types";

const SESSIONS = ["ASIA", "LONDON", "NY_AM", "NY_PM"];
const SESSION_LABELS: Record<string, string> = { LONDON: "London", NY_AM: "NY AM", NY_PM: "NY PM", ASIA: "Asia" };

const TRIADS = [
  { value: "NQ_ES_YM",      label: "NQ / ES / YM",         group: "INDICES" },
  { value: "EU_GU_DXY",     label: "EU / GU / DXY",        group: "FOREX" },
  { value: "BTC_ETH_TOTAL3",label: "BTC / ETH / TOTAL3",   group: "CRYPTO" },
];

const INSTRUMENTS: Record<string, string[]> = {
  NQ_ES_YM: ["NQ", "ES", "YM"],
  EU_GU_DXY: ["EUR/USD", "GBP/USD", "DXY"],
  BTC_ETH_TOTAL3: ["BTC", "ETH", "TOTAL3"],
};

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

export function Step1Market({ data, update }: Props) {
  const instruments = data.triad ? INSTRUMENTS[data.triad] ?? [] : [];

  return (
    <div className="space-y-4 pt-3">
      {/* Session */}
      <div>
        <label className="step-label">Session Focus</label>
        <div className="grid grid-cols-4 gap-2">
          {SESSIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ session: s })}
              className="py-2 rounded-lg text-xs font-medium border transition-colors"
              style={{
                background: data.session === s ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: data.session === s ? "var(--color-accent)" : "var(--color-bg-border)",
                color: data.session === s ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {SESSION_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Triad */}
      <div>
        <label className="step-label">Triad</label>
        <div className="space-y-1.5">
          {TRIADS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ triad: t.value, marketGroup: t.group, primaryInstrument: "", secondaryInstruments: [] })}
              className="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
              style={{
                background: data.triad === t.value ? "var(--color-accent-dim)" : "var(--color-bg-surface)",
                borderColor: data.triad === t.value ? "var(--color-accent)" : "var(--color-bg-border)",
                color: data.triad === t.value ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              }}
            >
              <span className="font-medium">{t.label}</span>
              <span className="ml-2 text-xs" style={{ color: "var(--color-text-muted)" }}>{t.group}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary instrument */}
      {instruments.length > 0 && (
        <div>
          <label className="step-label">Primary Instrument</label>
          <div className="flex gap-2">
            {instruments.map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => {
                  const sec = instruments.filter((i) => i !== inst);
                  update({ primaryInstrument: inst, secondaryInstruments: sec });
                }}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                style={{
                  background: data.primaryInstrument === inst ? "var(--color-accent)" : "var(--color-bg-surface)",
                  borderColor: data.primaryInstrument === inst ? "var(--color-accent)" : "var(--color-bg-border)",
                  color: data.primaryInstrument === inst ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {inst}
              </button>
            ))}
          </div>
          {data.primaryInstrument && (
            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
              Confirmation: {data.secondaryInstruments.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
