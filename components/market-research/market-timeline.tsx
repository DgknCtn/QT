import { MarketMessageCard } from "./market-message-card";
import { ANALYSIS_TYPE } from "./analysis-type-badge";
import type { MarketMessageWithRelations } from "@/app/(app)/market-research/queries";

const SECTION_ORDER = ["PRE_MARKET", "INTRADAY", "EOD", "EOW"] as const;
const SECTION_LABEL: Record<string, string> = {
  PRE_MARKET: "Pre-Market",
  INTRADAY: "Intraday",
  EOD: "End of Day",
  EOW: "End of Week",
};

export function MarketTimeline({
  messages,
  signedUrls,
}: {
  messages: MarketMessageWithRelations[];
  signedUrls: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      {SECTION_ORDER.map((type) => {
        const section = messages.filter((m) => m.analysisType === type);
        const accent = ANALYSIS_TYPE[type]?.color ?? "var(--color-text-muted)";
        return (
          <div key={type} className="pl-3" style={{ borderLeft: `2px solid ${accent}` }}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                {SECTION_LABEL[type]}
              </h3>
              <div className="flex-1 border-t" style={{ borderColor: "var(--color-bg-border)" }} />
            </div>
            {section.length === 0 ? (
              <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
                No {SECTION_LABEL[type]} analysis available.
              </p>
            ) : (
              <div className="space-y-1.5">
                {section.map((m) => (
                  <MarketMessageCard key={m.id} message={m} signedUrls={signedUrls} showAnalysisType={false} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
