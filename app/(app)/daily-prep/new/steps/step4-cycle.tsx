"use client";

import { AutoFillBadge } from "@/components/ui-kit/auto-filled-hint";
import type { PrepFormData } from "../types";

const WEEKLY = [
  { value: "MONDAY_Q1",     label: "Mon – Q1" },
  { value: "TUESDAY_Q2",    label: "Tue – Q2" },
  { value: "WEDNESDAY_Q3",  label: "Wed – Q3" },
  { value: "THURSDAY_Q4",   label: "Thu – Q4" },
  { value: "FRIDAY_SPECIAL",label: "Fri – Special" },
];
const DAILY = [
  { value: "ASIA",   label: "Asia  18:00–00:00" },
  { value: "LONDON", label: "London  00:00–06:00" },
  { value: "NY_AM",  label: "NY AM  06:00–12:00" },
  { value: "NY_PM",  label: "NY PM  12:00–18:00" },
];
const QUARTERS = [
  { value: "Q1", label: "Q1" },
  { value: "Q2", label: "Q2 / True Open" },
  { value: "Q3", label: "Q3" },
  { value: "Q4", label: "Q4" },
];
const Q1_QUALITIES = [
  { value: "TIGHT_RANGE",       label: "Tight Range",        hint: "Expansion likely — but confirm narrative + crack" },
  { value: "CLEAN_ACCUMULATION",label: "Clean Accumulation", hint: "High quality Q1" },
  { value: "OVEREXTENDED",      label: "Overextended",       hint: "Q2 consolidation risk — avoid immediate expansion" },
  { value: "DISTORTED",         label: "Distorted",          hint: "Treat with caution" },
  { value: "UNKNOWN",           label: "Unknown",            hint: "" },
];
const BEHAVIORS = ["EXPANSION", "CONSOLIDATION", "REVERSAL", "CONTINUATION", "WAIT"];

type Props = { data: PrepFormData; update: (p: Partial<PrepFormData>) => void };

function SectionTitle({ children, autoFilled, field }: { children: React.ReactNode; autoFilled?: string[]; field?: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide mb-2 mt-1 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
      {children}
      {autoFilled && field && <AutoFillBadge autoFilled={autoFilled} field={field} />}
    </p>
  );
}

function ChipRow({ items, selected, onSelect }: { items: { value: string; label: string }[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onSelect(item.value)}
          className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
          style={{
            background: selected === item.value ? "var(--color-accent)" : "var(--color-bg-surface)",
            borderColor: selected === item.value ? "var(--color-accent)" : "var(--color-bg-border)",
            color: selected === item.value ? "#fff" : "var(--color-text-secondary)",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Step4Cycle({ data, update }: Props) {
  const q1Hint = Q1_QUALITIES.find((q) => q.value === data.q1Quality)?.hint;

  return (
    <div className="space-y-4 pt-3">
      <div>
        <SectionTitle autoFilled={data.autoFilled} field="activeCycleWeekly">Weekly Cycle</SectionTitle>
        <ChipRow items={WEEKLY} selected={data.activeCycleWeekly} onSelect={(v) => update({ activeCycleWeekly: v })} />
      </div>

      <div>
        <SectionTitle autoFilled={data.autoFilled} field="activeCycleDaily">Daily Session</SectionTitle>
        <ChipRow items={DAILY} selected={data.activeCycleDaily} onSelect={(v) => update({ activeCycleDaily: v })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionTitle autoFilled={data.autoFilled} field="active90mCycle">Active 90m Quarter</SectionTitle>
          <ChipRow items={QUARTERS} selected={data.active90mCycle} onSelect={(v) => update({ active90mCycle: v })} />
        </div>
        <div>
          <SectionTitle autoFilled={data.autoFilled} field="activeMicroCycle">Micro Quarter</SectionTitle>
          {/* Eskiden burada bir "Disabled" çipi vardı; QuarterCycle enum'unda
              böyle bir değer yok ve seçilince kayıt Prisma hatasıyla patlıyordu.
              Yerine seçimi kaldıran bir bağlantı kondu. */}
          <ChipRow items={QUARTERS} selected={data.activeMicroCycle} onSelect={(v) => update({ activeMicroCycle: v })} />
          {data.activeMicroCycle && (
            <button
              type="button"
              onClick={() => update({ activeMicroCycle: "" })}
              className="text-xs mt-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Seçimi kaldır
            </button>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Q1 Quality</SectionTitle>
        <div className="space-y-1.5">
          {Q1_QUALITIES.map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => update({ q1Quality: q.value })}
              className="w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors"
              style={{
                background: data.q1Quality === q.value ? "var(--color-accent-dim)" : "var(--color-bg-surface)",
                borderColor: data.q1Quality === q.value ? "var(--color-accent)" : "var(--color-bg-border)",
                color: data.q1Quality === q.value ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              }}
            >
              <span className="font-medium">{q.label}</span>
              {q.hint && <span className="ml-2" style={{ color: "var(--color-text-muted)" }}>– {q.hint}</span>}
            </button>
          ))}
        </div>
        {q1Hint && (
          <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ background: "rgba(79,142,247,0.08)", color: "var(--color-accent)" }}>
            {q1Hint}
          </p>
        )}
      </div>

      <div>
        <SectionTitle>Expected Next Behavior</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {BEHAVIORS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => update({ expectedBehavior: b })}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: data.expectedBehavior === b ? "var(--color-accent)" : "var(--color-bg-surface)",
                borderColor: data.expectedBehavior === b ? "var(--color-accent)" : "var(--color-bg-border)",
                color: data.expectedBehavior === b ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
