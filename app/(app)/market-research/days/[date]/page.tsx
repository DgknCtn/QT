import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getDayByDate, getSignedUrlsForMessages } from "../../queries";
import { MarketTimeline } from "@/components/market-research/market-timeline";
import { AnalysisTypeBadge } from "@/components/market-research/analysis-type-badge";

const ANALYSIS_ORDER = ["PRE_MARKET", "INTRADAY", "EOD", "EOW"] as const;

export default async function MarketDayDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) notFound();

  const day = await getDayByDate(parsed);
  if (!day) notFound();

  const signedUrls = await getSignedUrlsForMessages(day.messages);
  const presentTypes = new Set(day.messages.map((m) => m.analysisType));
  const instruments = [
    ...new Set(day.messages.flatMap((m) => m.instruments.map((i) => i.instrument))),
  ];
  const imageCount = day.messages.reduce((n, m) => n + m.attachments.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div
        className="sticky z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold"
        style={{
          top: 56,
          background: "var(--color-bg-elevated)",
          borderColor: "var(--color-bg-border)",
          color: "var(--color-text-primary)",
        }}
      >
        <span>{format(day.date, "d MMMM yyyy")}</span>
        {instruments.map((i) => (
          <span key={i} style={{ color: "var(--color-text-muted)" }}>{i}</span>
        ))}
      </div>

      <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          {format(day.date, "d MMMM yyyy")}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{format(day.date, "EEEE")}</p>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {instruments.map((i) => (
            <span key={i} className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
              {i}
            </span>
          ))}
          {day.marketWeek && (
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Week of {format(day.marketWeek.weekStart, "d MMM")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {ANALYSIS_ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs" style={{ color: presentTypes.has(t) ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>
              <AnalysisTypeBadge type={t} />
              {presentTypes.has(t) ? "✓" : "—"}
            </span>
          ))}
        </div>

        <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>{day.messages.length} mesaj</span>
          <span>{imageCount} görsel</span>
        </div>
      </div>

      <MarketTimeline messages={day.messages} signedUrls={signedUrls} />
    </div>
  );
}
