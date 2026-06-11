"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PrepFormData, NewsEvent } from "../types";

const IMPACTS = ["HIGH", "MEDIUM", "LOW"];
const RISK_TAGS = ["IGNORE", "WATCH", "HIGH_RISK", "NO_TRADE_WINDOW", "DATA_HIGH_LOW_RELEVANT"];
const RISK_LABELS: Record<string, string> = {
  IGNORE: "Ignore",
  WATCH: "Watch",
  HIGH_RISK: "High Risk",
  NO_TRADE_WINDOW: "No Trade Window",
  DATA_HIGH_LOW_RELEVANT: "Data H/L Relevant",
};

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

export function Step3Calendar({ data, update }: Props) {
  const [form, setForm] = useState<Omit<NewsEvent, "id">>({
    eventName: "", time: "", currency: "", impact: "HIGH", riskTag: "WATCH", notes: "",
  });

  function addEvent() {
    if (!form.eventName || !form.time) return;
    const event: NewsEvent = { ...form, id: crypto.randomUUID() };
    update({ newsEvents: [...data.newsEvents, event] });
    setForm({ eventName: "", time: "", currency: "", impact: "HIGH", riskTag: "WATCH", notes: "" });
  }

  function removeEvent(id: string) {
    update({ newsEvents: data.newsEvents.filter((e) => e.id !== id) });
  }

  function updateEvent(id: string, field: keyof NewsEvent, value: string) {
    update({ newsEvents: data.newsEvents.map((e) => e.id === id ? { ...e, [field]: value } : e) });
  }

  return (
    <div className="space-y-4 pt-3">
      {/* Existing events */}
      {data.newsEvents.length > 0 && (
        <div className="space-y-2">
          {data.newsEvents.map((evt) => (
            <div
              key={evt.id}
              className="rounded-lg border p-3 space-y-2"
              style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: evt.impact === "HIGH" ? "rgba(239,68,68,0.15)" : evt.impact === "MEDIUM" ? "rgba(245,158,11,0.15)" : "rgba(52,201,126,0.15)",
                      color: evt.impact === "HIGH" ? "var(--color-danger)" : evt.impact === "MEDIUM" ? "var(--color-warning)" : "var(--color-success)",
                    }}
                  >
                    {evt.impact}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{evt.eventName}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{evt.time} · {evt.currency}</span>
                </div>
                <button onClick={() => removeEvent(evt.id)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--color-text-muted)" }}>
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {RISK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => updateEvent(evt.id, "riskTag", tag)}
                    className="px-2 py-0.5 rounded text-xs border transition-colors"
                    style={{
                      background: evt.riskTag === tag ? "var(--color-accent)" : "transparent",
                      borderColor: evt.riskTag === tag ? "var(--color-accent)" : "var(--color-bg-border)",
                      color: evt.riskTag === tag ? "#fff" : "var(--color-text-muted)",
                    }}
                  >
                    {RISK_LABELS[tag]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="rounded-lg border p-3 space-y-3" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Add Economic Event</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="text"
              value={form.eventName}
              onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
              placeholder="Event name (CPI, NFP, FOMC…)"
              className="field-input"
            />
          </div>
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            className="field-input"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            placeholder="USD / EUR…"
            className="field-input"
          />
          <select value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))} className="field-input">
            {IMPACTS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={form.riskTag} onChange={(e) => setForm((f) => ({ ...f, riskTag: e.target.value }))} className="field-input">
            {RISK_TAGS.map((t) => <option key={t} value={t}>{RISK_LABELS[t]}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={addEvent}
          disabled={!form.eventName || !form.time}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-opacity"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={12} /> Add Event
        </button>
      </div>
    </div>
  );
}
