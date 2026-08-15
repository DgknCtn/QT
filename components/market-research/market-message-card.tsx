import { format } from "date-fns";
import { AnalysisTypeBadge } from "./analysis-type-badge";
import { ImageGallery, type GalleryImage } from "./image-gallery";
import { HighlightText } from "./highlight-text";
import type { MarketMessageWithRelations } from "@/app/(app)/market-research/queries";

const INSTRUMENT_COLOR: Record<string, string> = {
  NQ: "var(--color-accent)",
  ES: "var(--color-success)",
  YM: "var(--color-warning)",
};

export function MarketMessageCard({
  message,
  signedUrls,
  showAnalysisType = true,
  highlightQuery,
}: {
  message: MarketMessageWithRelations;
  signedUrls: Record<string, string>;
  showAnalysisType?: boolean;
  highlightQuery?: string;
}) {
  const images: GalleryImage[] = message.attachments.map((a) => ({
    id: a.id,
    thumbnailUrl: signedUrls[a.thumbnailStorageKey ?? ""] ?? signedUrls[a.storageKey] ?? null,
    fullUrl: signedUrls[a.storageKey] ?? null,
    originalFilename: a.originalFilename,
  }));

  const isOdin = message.author.toLowerCase() === "odin";

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        background: "var(--color-bg-elevated)",
        borderColor: "var(--color-bg-border)",
        borderLeft: isOdin ? "3px solid var(--color-accent)" : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span
          className="text-xs font-mono tabular-nums shrink-0"
          style={{ color: "var(--color-text-muted)", minWidth: 40 }}
        >
          {format(message.timestamp, "HH:mm")}
        </span>
        <span
          className="text-sm"
          style={{
            color: isOdin ? "var(--color-accent)" : "var(--color-text-primary)",
            fontWeight: isOdin ? 700 : 600,
          }}
        >
          {message.author}
        </span>
        {showAnalysisType && <AnalysisTypeBadge type={message.analysisType} />}
        {message.instruments.map((i) => (
          <span
            key={i.id}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: INSTRUMENT_COLOR[i.instrument] ?? "var(--color-text-muted)", background: "var(--color-bg-surface)" }}
          >
            {i.instrument}
          </span>
        ))}
      </div>

      {message.content && (
        <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
          <HighlightText text={message.content} query={highlightQuery} />
        </p>
      )}

      <ImageGallery images={images} />
    </div>
  );
}
