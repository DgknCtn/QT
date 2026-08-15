"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INSTRUMENTS = ["NQ", "ES", "YM"] as const;

export function DayFilters({
  initialValues,
}: {
  initialValues: { dateFrom?: string; dateTo?: string; instrument?: string };
}) {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState(initialValues.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initialValues.dateTo ?? "");
  const [instrument, setInstrument] = useState(initialValues.instrument ?? "");

  function apply(next: Partial<{ dateFrom: string; dateTo: string; instrument: string }>) {
    const params = new URLSearchParams();
    const merged = { dateFrom, dateTo, instrument, ...next };
    if (merged.dateFrom) params.set("dateFrom", merged.dateFrom);
    if (merged.dateTo) params.set("dateTo", merged.dateTo);
    if (merged.instrument) params.set("instrument", merged.instrument);
    router.push(`/market-research/days?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => {
          setDateFrom(e.target.value);
          apply({ dateFrom: e.target.value });
        }}
        className="text-xs rounded-lg border px-2 py-1.5"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)", color: "var(--color-text-primary)" }}
      />
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => {
          setDateTo(e.target.value);
          apply({ dateTo: e.target.value });
        }}
        className="text-xs rounded-lg border px-2 py-1.5"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)", color: "var(--color-text-primary)" }}
      />
      <div className="flex gap-1">
        {INSTRUMENTS.map((i) => (
          <button
            key={i}
            onClick={() => {
              const next = instrument === i ? "" : i;
              setInstrument(next);
              apply({ instrument: next });
            }}
            className="text-xs font-bold px-2 py-1.5 rounded-lg border"
            style={{
              background: instrument === i ? "var(--color-accent)" : "var(--color-bg-elevated)",
              borderColor: "var(--color-bg-border)",
              color: instrument === i ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}
