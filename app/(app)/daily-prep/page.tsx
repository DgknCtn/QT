import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";

export default function DailyPrepPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Your daily prep entries
        </p>
        <Link
          href="/daily-prep/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={12} /> New Prep
        </Link>
      </div>

      <div
        className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
      >
        <ClipboardList size={32} style={{ color: "var(--color-text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No preps yet</p>
        <Link
          href="/daily-prep/new"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Start your first prep
        </Link>
      </div>
    </div>
  );
}
