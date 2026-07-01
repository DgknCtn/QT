function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-bg-border)" }}
    />
  );
}

export default function JournalLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Block className="h-10 w-72" />
        <Block className="h-8 w-24" />
      </div>
      <Block className="h-12 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
