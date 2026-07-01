export function ProgressBar({
  value,
  max,
  color = "var(--color-accent)",
  danger = false,
  height = 6,
}: {
  value: number;
  max: number;
  color?: string;
  danger?: boolean;
  height?: number;
}) {
  const pct = Math.min(max > 0 ? (value / max) * 100 : 0, 100);
  // For danger bars (loss/drawdown): red ≥90%, amber ≥70%. For normal: green at 100%.
  const bg = danger
    ? pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : color
    : pct >= 100 ? "#34c97e" : color;
  return (
    <div className="rounded-full overflow-hidden bg-app" style={{ height, background: "var(--color-bg-border)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bg }} />
    </div>
  );
}
