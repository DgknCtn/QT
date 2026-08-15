import { format, isToday } from "date-fns";
import { getDayByDate, getMostRecentDay, getSignedUrlsForMessages } from "../queries";
import { MarketTimeline } from "@/components/market-research/market-timeline";

export default async function TodayPage() {
  const today = await getDayByDate(new Date());
  const day = today ?? (await getMostRecentDay());
  const signedUrls = day ? await getSignedUrlsForMessages(day.messages) : {};
  const isCurrent = day ? isToday(day.date) : false;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Today</h1>
        {day ? (
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {format(day.date, "d MMMM yyyy, EEEE")}
            {!isCurrent && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-surface)", color: "var(--color-warning)" }}>
                En son mevcut piyasa günü — bugün aktif işlem günü değil
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{format(new Date(), "d MMMM yyyy, EEEE")}</p>
        )}
      </div>

      {day ? (
        <MarketTimeline messages={day.messages} signedUrls={signedUrls} />
      ) : (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-2"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No Market Research data is available yet.</p>
        </div>
      )}
    </div>
  );
}
