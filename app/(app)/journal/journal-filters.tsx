"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X, Clock } from "lucide-react";

interface FilterValues {
  instrument?: string;
  result?: string;
  session?: string;
  direction?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

const RESULTS    = ["WIN", "LOSS", "BE", "PARTIAL", "MISSED", "NO_TRADE"];
const SESSIONS   = ["ASIA", "LONDON", "NY_AM", "NY_PM", "NY_LUNCH", "OVERNIGHT"];
const DIRECTIONS = ["LONG", "SHORT"];
const HISTORY_KEY = "qt-journal-filter-history";
const MAX_HISTORY = 6;

function filterLabel(v: FilterValues): string {
  const parts: string[] = [];
  if (v.search)     parts.push(v.search);
  if (v.instrument) parts.push(v.instrument);
  if (v.result)     parts.push(v.result);
  if (v.direction)  parts.push(v.direction);
  if (v.session)    parts.push(v.session.replace("_", " "));
  if (v.dateFrom || v.dateTo) parts.push(`${v.dateFrom ?? ""}→${v.dateTo ?? ""}`);
  return parts.join(" · ");
}

function hasMeaningfulValue(v: FilterValues) {
  return Object.values(v).some(Boolean);
}

function loadHistory(): FilterValues[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveToHistory(v: FilterValues) {
  const label = filterLabel(v);
  const existing = loadHistory();
  const filtered = existing.filter((e) => filterLabel(e) !== label);
  const next = [v, ...filtered].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function JournalFilters({ initialValues }: { initialValues: FilterValues }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [expanded, setExpanded] = useState(
    !!(initialValues.result || initialValues.session || initialValues.direction || initialValues.dateFrom || initialValues.dateTo)
  );
  const [vals, setVals] = useState<FilterValues>({
    instrument: initialValues.instrument ?? "",
    result:     initialValues.result ?? "",
    session:    initialValues.session ?? "",
    direction:  initialValues.direction ?? "",
    dateFrom:   initialValues.dateFrom ?? "",
    dateTo:     initialValues.dateTo ?? "",
    search:     initialValues.search ?? "",
  });
  const [history, setHistory] = useState<FilterValues[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function applyVals(next: FilterValues) {
    setVals(next);
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v) params.set(k, v); });
    startTransition(() => { router.push(`${pathname}?${params.toString()}`); });

    if (hasMeaningfulValue(next)) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveToHistory(next);
        setHistory(loadHistory());
      }, 1500);
    }
  }

  function update(key: keyof FilterValues, value: string) {
    applyVals({ ...vals, [key]: value });
  }

  function applyPreset(preset: FilterValues) {
    applyVals({
      instrument: preset.instrument ?? "",
      result:     preset.result ?? "",
      session:    preset.session ?? "",
      direction:  preset.direction ?? "",
      dateFrom:   preset.dateFrom ?? "",
      dateTo:     preset.dateTo ?? "",
      search:     preset.search ?? "",
    });
    if (preset.result || preset.session || preset.direction || preset.dateFrom || preset.dateTo) {
      setExpanded(true);
    }
  }

  function clear() {
    setVals({ instrument: "", result: "", session: "", direction: "", dateFrom: "", dateTo: "", search: "" });
    router.push(pathname);
  }

  const hasAny = Object.values(vals).some(Boolean);

  const inputStyle = {
    background: "var(--color-bg-surface)",
    border: "1px solid var(--color-bg-border)",
    borderRadius: 8,
    color: "var(--color-text-primary)",
    fontSize: 12,
    padding: "6px 10px",
    outline: "none",
    width: "100%",
  } as React.CSSProperties;

  const selectStyle = { ...inputStyle, cursor: "pointer" } as React.CSSProperties;

  return (
    <div className="rounded-xl border p-3 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
      {/* Search + toggle row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Enstrüman veya not ara..."
            value={vals.search}
            onChange={(e) => update("search", e.target.value)}
            style={{ ...inputStyle, paddingLeft: 28 }}
          />
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: expanded ? "var(--color-accent)" : "var(--color-bg-surface)",
            color: expanded ? "#fff" : "var(--color-text-muted)",
            border: "1px solid var(--color-bg-border)",
          }}
        >
          <SlidersHorizontal size={12} /> Filtreler
        </button>
        {hasAny && (
          <button
            onClick={clear}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs"
            style={{ color: "var(--color-danger)", border: "1px solid var(--color-bg-border)", background: "var(--color-bg-surface)" }}
          >
            <X size={12} /> Temizle
          </button>
        )}
      </div>

      {/* Recent filter history */}
      {history.length > 0 && !hasAny && (
        <div className="flex items-center gap-2 flex-wrap">
          <Clock size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => applyPreset(h)}
              className="px-2 py-0.5 rounded-md text-xs transition-colors"
              style={{
                background: "var(--color-bg-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-bg-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent)";
                e.currentTarget.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-bg-border)";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              {filterLabel(h)}
            </button>
          ))}
        </div>
      )}

      {/* Advanced filters */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Enstrüman</label>
            <input
              type="text"
              placeholder="NQ, ES, EURUSD..."
              value={vals.instrument}
              onChange={(e) => update("instrument", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Sonuç</label>
            <select value={vals.result} onChange={(e) => update("result", e.target.value)} style={selectStyle}>
              <option value="">Tümü</option>
              {RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Seans</label>
            <select value={vals.session} onChange={(e) => update("session", e.target.value)} style={selectStyle}>
              <option value="">Tümü</option>
              {SESSIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Yön</label>
            <select value={vals.direction} onChange={(e) => update("direction", e.target.value)} style={selectStyle}>
              <option value="">Tümü</option>
              {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Başlangıç tarihi</label>
            <input
              type="date"
              value={vals.dateFrom}
              onChange={(e) => update("dateFrom", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Bitiş tarihi</label>
            <input
              type="date"
              value={vals.dateTo}
              onChange={(e) => update("dateTo", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
