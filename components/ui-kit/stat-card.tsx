export function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number | null;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs mb-1 text-muted">{label}</p>
      <p className="text-2xl font-bold" style={valueColor ? { color: valueColor } : undefined}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-xs mt-0.5 text-muted">{sub}</p>}
    </div>
  );
}
