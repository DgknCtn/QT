import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Image as ImageIcon } from "lucide-react";
import { listDays } from "../queries";
import { DayFilters } from "./day-filters";
import { AnalysisTypeBadge } from "@/components/market-research/analysis-type-badge";

export default async function MarketDaysPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; instrument?: string }>;
}) {
  const sp = await searchParams;
  const days = await listDays({
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    instrument: sp.instrument as "NQ" | "ES" | "YM" | undefined,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Market Days</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Kronolojik arşiv</p>
      </div>

      <DayFilters initialValues={sp} />

      {days.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-2"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <CalendarDays size={28} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Kayıt bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => {
            const analysisTypes = [...new Set(day.messages.map((m) => m.analysisType))];
            const imageCount = day.messages.reduce((n, m) => n + m.attachments.length, 0);
            return (
              <Link
                key={day.id}
                href={`/market-research/days/${format(day.date, "yyyy-MM-dd")}`}
                className="flex items-center justify-between rounded-xl border p-3 hover:border-[var(--color-accent)] transition-colors"
                style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {format(day.date, "d MMMM yyyy")}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{format(day.date, "EEEE")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {analysisTypes.map((t) => (
                      <AnalysisTypeBadge key={t} type={t} />
                    ))}
                  </div>
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                    <ImageIcon size={12} /> {imageCount}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{day._count.messages} mesaj</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
