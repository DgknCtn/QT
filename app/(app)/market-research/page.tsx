import Link from "next/link";
import { Radar, CalendarDays, Search } from "lucide-react";
import { format } from "date-fns";
import { getMostRecentDay, getSignedUrlsForMessages } from "./queries";
import { MarketTimeline } from "@/components/market-research/market-timeline";

export default async function MarketResearchOverviewPage() {
  const day = await getMostRecentDay();
  const signedUrls = day ? await getSignedUrlsForMessages(day.messages) : {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Market Research</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Odin&apos;in tarihsel piyasa yorumları ve chart arşivi
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/market-research/today"
          className="rounded-xl border p-4 flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <Radar size={18} style={{ color: "var(--color-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Today</span>
        </Link>
        <Link
          href="/market-research/days"
          className="rounded-xl border p-4 flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <CalendarDays size={18} style={{ color: "var(--color-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Market Days</span>
        </Link>
        <Link
          href="/market-research/search"
          className="rounded-xl border p-4 flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <Search size={18} style={{ color: "var(--color-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Search</span>
        </Link>
      </div>

      {day ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              En son: {format(day.date, "d MMMM yyyy")}
            </h2>
            <Link href={`/market-research/days/${format(day.date, "yyyy-MM-dd")}`} className="text-xs" style={{ color: "var(--color-accent)" }}>
              Tam günü aç →
            </Link>
          </div>
          <MarketTimeline messages={day.messages} signedUrls={signedUrls} />
        </div>
      ) : (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-2"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No Market Research data is available yet.
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Import a Discord export to begin building the archive.
          </p>
        </div>
      )}
    </div>
  );
}
