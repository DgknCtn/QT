import "server-only";
import { prisma } from "@/lib/prisma";
import { createSignedAttachmentUrls } from "@/lib/supabase/market-research-storage";
import type { Prisma } from "@prisma/client";

const MESSAGE_INCLUDE = {
  attachments: true,
  instruments: true,
} satisfies Prisma.MarketMessageInclude;

export type MarketMessageWithRelations = Prisma.MarketMessageGetPayload<{
  include: typeof MESSAGE_INCLUDE;
}>;

/** Signed URL map keyed by storageKey (originals + thumbnails combined). */
export async function getSignedUrlsForMessages(
  messages: MarketMessageWithRelations[]
): Promise<Record<string, string>> {
  const keys = messages.flatMap((m) =>
    m.attachments.flatMap((a) => [a.storageKey, a.thumbnailStorageKey].filter(Boolean) as string[])
  );
  if (keys.length === 0) return {};
  try {
    return await createSignedAttachmentUrls(keys, 3600);
  } catch {
    // Storage misconfigured (e.g. bucket/service key not set up yet) -- degrade
    // gracefully to text-only rendering rather than breaking the whole page.
    return {};
  }
}

export async function getDayByDate(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return prisma.marketDay.findUnique({
    where: { date: start },
    include: {
      marketWeek: true,
      messages: {
        orderBy: { timestamp: "asc" },
        include: MESSAGE_INCLUDE,
      },
    },
  });
}

export async function getMostRecentDay() {
  const day = await prisma.marketDay.findFirst({ orderBy: { date: "desc" } });
  if (!day) return null;
  return getDayByDate(day.date);
}

export interface DayListFilters {
  dateFrom?: string;
  dateTo?: string;
  instrument?: "NQ" | "ES" | "YM";
}

export async function listDays(filters: DayListFilters, take = 30) {
  const where: Prisma.MarketDayWhereInput = {};
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo + "T23:59:59Z");
  }
  if (filters.instrument) {
    where.messages = { some: { instruments: { some: { instrument: filters.instrument } } } };
  }

  return prisma.marketDay.findMany({
    where,
    orderBy: { date: "desc" },
    take,
    include: {
      _count: { select: { messages: true } },
      messages: {
        select: { analysisType: true, attachments: { select: { id: true } } },
      },
    },
  });
}

export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  instrument?: "NQ" | "ES" | "YM";
  analysisType?: "PRE_MARKET" | "INTRADAY" | "EOD" | "EOW";
  channel?: string;
}

/**
 * Hybrid search: raw SQL only for the full-text predicate (Prisma has no
 * native tsvector support), then a normal Prisma findMany for relation
 * hydration + additional structured filters. See PRD section 13.
 */
export async function searchMessages(filters: SearchFilters, take = 50) {
  let candidateIds: string[] | null = null;

  if (filters.query && filters.query.trim().length > 0) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM market_messages
      WHERE to_tsvector('simple', content) @@ plainto_tsquery('simple', ${filters.query})
      ORDER BY timestamp DESC
      LIMIT 500
    `;
    candidateIds = rows.map((r) => r.id);
    if (candidateIds.length === 0) return [];
  }

  const where: Prisma.MarketMessageWhereInput = {};
  if (candidateIds) where.id = { in: candidateIds };
  if (filters.analysisType) where.analysisType = filters.analysisType;
  if (filters.channel) where.sourceChannel = filters.channel;
  if (filters.instrument) where.instruments = { some: { instrument: filters.instrument } };
  if (filters.dateFrom || filters.dateTo) {
    where.timestamp = {};
    if (filters.dateFrom) where.timestamp.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.timestamp.lte = new Date(filters.dateTo + "T23:59:59Z");
  }

  return prisma.marketMessage.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take,
    include: { ...MESSAGE_INCLUDE, marketDay: { select: { date: true } } },
  });
}

export async function listRecentImportRuns(take = 20) {
  return prisma.marketImportRun.findMany({ orderBy: { startedAt: "desc" }, take });
}
