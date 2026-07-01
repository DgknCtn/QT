// Unified status badge — replaces dashboard.GoNoGoBadge, journal.ResultBadge/GradeBadge.

const RESULT: Record<string, { label: string; bg: string; color: string }> = {
  WIN:      { label: "WIN",      bg: "rgba(52,201,126,0.15)",  color: "var(--color-success)" },
  LOSS:     { label: "LOSS",     bg: "rgba(239,68,68,0.15)",   color: "var(--color-danger)" },
  BE:       { label: "BE",       bg: "rgba(245,158,11,0.15)",  color: "var(--color-warning)" },
  PARTIAL:  { label: "PARTIAL",  bg: "rgba(79,142,247,0.15)",  color: "var(--color-accent)" },
  MISSED:   { label: "MISSED",   bg: "rgba(144,144,160,0.15)", color: "var(--color-text-muted)" },
  NO_TRADE: { label: "NO TRADE", bg: "rgba(144,144,160,0.15)", color: "var(--color-text-muted)" },
};

const GRADE: Record<string, { color: string }> = {
  A_PLUS:     { color: "var(--color-success)" },
  B:          { color: "var(--color-accent)" },
  C:          { color: "var(--color-warning)" },
  RULE_BREAK: { color: "var(--color-danger)" },
};

const GONOGO: Record<string, { label: string; color: string }> = {
  GO:           { label: "GO",           color: "var(--color-go)" },
  NO_GO:        { label: "NO-GO",        color: "var(--color-nogo)" },
  WAIT:         { label: "WAIT",         color: "var(--color-wait)" },
  REVIEW_LATER: { label: "REVIEW LATER", color: "var(--color-wait)" },
  MISSED_SETUP: { label: "MISSED",       color: "var(--color-text-muted)" },
};

export function ResultBadge({ result }: { result: string }) {
  const s = RESULT[result] ?? { label: result, bg: "transparent", color: "var(--color-text-muted)" };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const c = GRADE[grade]?.color ?? "var(--color-text-muted)";
  return <span className="text-xs font-bold" style={{ color: c }}>{grade.replace("_", "+")}</span>;
}

export function GoNoGoBadge({ status, fallback = "No prep today" }: { status: string | null; fallback?: string }) {
  if (!status) return <span className="text-xs text-muted">{fallback}</span>;
  const item = GONOGO[status] ?? { label: status, color: "var(--color-text-secondary)" };
  return <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>;
}
