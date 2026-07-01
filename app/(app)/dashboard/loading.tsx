function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-bg-border)" }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Block className="h-10 w-56" />
        <Block className="h-10 w-32" />
      </div>
      <Block className="h-20 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Block className="h-24" />
        <Block className="h-24" />
        <Block className="h-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Block className="h-20" />
        <Block className="h-20" />
        <Block className="h-20" />
        <Block className="h-20" />
      </div>
      <Block className="h-40 w-full" />
    </div>
  );
}
