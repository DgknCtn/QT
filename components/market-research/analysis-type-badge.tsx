const ANALYSIS_TYPE: Record<string, { label: string; color: string; bg: string }> = {
  PRE_MARKET: { label: "PRE-MARKET", color: "var(--color-accent)", bg: "rgba(79,142,247,0.15)" },
  INTRADAY: { label: "INTRADAY", color: "var(--color-warning)", bg: "rgba(245,158,11,0.15)" },
  EOD: { label: "EOD", color: "var(--color-success)", bg: "rgba(52,201,126,0.15)" },
  EOW: { label: "EOW", color: "var(--color-danger)", bg: "rgba(239,68,68,0.15)" },
};

export function AnalysisTypeBadge({ type }: { type: string }) {
  const s = ANALYSIS_TYPE[type] ?? { label: type, color: "var(--color-text-muted)", bg: "transparent" };
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
