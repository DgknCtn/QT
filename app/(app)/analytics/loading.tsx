function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-bg-border)" }}
    />
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Block className="h-8 w-32" />
        <Block className="h-8 w-28" />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Block key={i} className="h-8 w-20" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Block className="h-20" />
        <Block className="h-20" />
        <Block className="h-20" />
      </div>
      <Block className="h-56 w-full" />
      <Block className="h-64 w-full" />
    </div>
  );
}
