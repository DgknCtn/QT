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

  const totalMessages = days.reduce((n, d) => n + d._count.messages, 0);
  const totalImages = days.reduce((n, d) => n + d.messages.reduce((m, msg) => m + msg.attachments.length, 0), 0);

  const groups: { label: string; days: typeof days }[] = [];
  for (const day of days) {
    const label = format(day.date, "MMMM yyyy");
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.days.push(day);
    else groups.push({ label, days: [day] });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Market Days</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Kronolojik arşiv</p>
      </div>

      {days.length > 0 && (
        <div className="flex gap-6">
          {[
            { label: "Gün", value: days.length },
            { label: "Mesaj", value: totalMessages },
            { label: "Görsel", value: totalImages },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

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
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p
                className="sticky z-10 text-xs font-bold uppercase tracking-wide py-1 mb-1.5"
                style={{ top: 56, color: "var(--color-text-muted)", background: "var(--color-bg-base)" }}
              >
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.days.map((day) => {
                  const analysisTypes = [...new Set(day.messages.map((m) => m.analysisType))];
                  const imageCount = day.messages.reduce((n, m) => n + m.attachments.length, 0);
                  return (
                    <Link
                      key={day.id}
                      href={`/market-research/days/${format(day.date, "yyyy-MM-dd")}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 hover:border-[var(--color-accent)] transition-colors"
                      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {format(day.date, "d MMMM yyyy")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{format(day.date, "EEEE")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {analysisTypes.map((t) => (
                            <AnalysisTypeBadge key={t} type={t} />
                          ))}
                        </div>
                        <span className="text-xs flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-muted)", width: 40 }}>
                          <ImageIcon size={12} /> {imageCount}
                        </span>
                        <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)", width: 56, textAlign: "right" }}>
                          {day._count.messages} mesaj
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
