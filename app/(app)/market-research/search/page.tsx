import Link from "next/link";
import { format } from "date-fns";
import { Search as SearchIcon } from "lucide-react";
import { searchMessages, getSignedUrlsForMessages } from "../queries";
import { SearchFilters } from "./search-filters";
import { MarketMessageCard } from "@/components/market-research/market-message-card";

export default async function MarketResearchSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dateFrom?: string; dateTo?: string; instrument?: string; analysisType?: string }>;
}) {
  const sp = await searchParams;
  const hasQuery = !!(sp.q || sp.instrument || sp.analysisType || sp.dateFrom || sp.dateTo);

  const results = hasQuery
    ? await searchMessages({
        query: sp.q,
        dateFrom: sp.dateFrom,
        dateTo: sp.dateTo,
        instrument: sp.instrument as "NQ" | "ES" | "YM" | undefined,
        analysisType: sp.analysisType as "PRE_MARKET" | "INTRADAY" | "EOD" | "EOW" | undefined,
      })
    : [];

  const signedUrls = results.length > 0 ? await getSignedUrlsForMessages(results) : {};

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Search</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Arşiv genelinde metin arama</p>
      </div>

      <SearchFilters initialValues={sp} />

      {!hasQuery ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 gap-2"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <SearchIcon size={28} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Aramaya başlamak için bir terim veya filtre gir</p>
        </div>
      ) : results.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Sonuç bulunamadı</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{results.length} sonuç</p>
          {results.map((m) => (
            <div key={m.id} className="space-y-1">
              <MarketMessageCard message={m} signedUrls={signedUrls} />
              <Link
                href={`/market-research/days/${format(m.marketDay.date, "yyyy-MM-dd")}`}
                className="text-xs inline-block"
                style={{ color: "var(--color-accent)" }}
              >
                Open Market Day ({format(m.marketDay.date, "d MMM yyyy")}) →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
