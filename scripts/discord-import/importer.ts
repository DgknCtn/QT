import path from "node:path";
import { prisma } from "../../lib/prisma";
import { parseExportFile, resolveChannelAndAnalysisType } from "./parser";
import { normalizeExport } from "./normalizer";
import { extractAndUploadAttachment } from "./attachment-extractor";

export interface ImportOptions {
  /** Directory containing the .html export files AND their sibling `_Files` dirs. */
  exportDir: string;
  filePaths: string[];
  dryRun: boolean;
  importRunId?: string;
}

export interface ImportErrorDetail {
  file: string;
  reason: string;
}

export interface ImportSummary {
  filesTotal: number;
  filesDone: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetail: ImportErrorDetail[];
}

function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Supabase storage calls occasionally hang indefinitely on a dropped connection
 *  (no built-in timeout) -- race against a hard deadline so one bad upload
 *  can't stall the entire run. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${label}`)), ms)),
  ]);
}

/**
 * Orchestrates the full import: parse -> normalize -> dedup-check -> persist,
 * one message (and its own DB transaction) at a time, so a single malformed
 * or unreadable message never aborts the rest of the run (PRD section 27).
 */
export async function runImport(options: ImportOptions): Promise<ImportSummary> {
  const summary: ImportSummary = {
    filesTotal: options.filePaths.length,
    filesDone: 0,
    imported: 0,
    duplicates: 0,
    errors: 0,
    errorDetail: [],
  };

  // Cache MarketDay upserts across the whole run -- many messages share a date.
  const dayCache = new Map<string, string>();
  async function getOrCreateMarketDay(dayDate: Date): Promise<string> {
    const key = dayDate.toISOString();
    const cached = dayCache.get(key);
    if (cached) return cached;
    let marketDay;
    try {
      marketDay = await prisma.marketDay.upsert({ where: { date: dayDate }, create: { date: dayDate }, update: {} });
    } catch {
      // Concurrent messages for a brand-new date can race on the upsert's
      // unique constraint -- fall back to a plain lookup for the loser.
      marketDay = await prisma.marketDay.findUniqueOrThrow({ where: { date: dayDate } });
    }
    dayCache.set(key, marketDay.id);
    return marketDay.id;
  }

  for (const filePath of options.filePaths) {
    const fileName = path.basename(filePath);
    const resolved = resolveChannelAndAnalysisType(fileName);
    if (!resolved) {
      summary.errors++;
      summary.errorDetail.push({
        file: fileName,
        reason: "Unrecognized channel -- filename does not match pre-market-analizi/market-intraday/eod/eow",
      });
      summary.filesDone++;
      continue;
    }

    let parsed: ReturnType<typeof parseExportFile>;
    try {
      parsed = parseExportFile(filePath);
    } catch (err) {
      summary.errors++;
      summary.errorDetail.push({ file: fileName, reason: `Parse failure: ${(err as Error).message}` });
      summary.filesDone++;
      continue;
    }

    const normalized = normalizeExport(parsed, resolved);

    // Batch the dedup check per file (one round-trip) instead of per message --
    // with thousands of messages, per-message findFirst calls over the network
    // to Supabase were the dominant cost.
    const existingRows = await prisma.marketMessage.findMany({
      where: {
        OR: [
          { sourceMessageId: { in: normalized.map((m) => m.sourceMessageId) } },
          { contentHash: { in: normalized.map((m) => m.contentHash) } },
        ],
      },
      select: { sourceMessageId: true, contentHash: true },
    });
    const existingSourceIds = new Set(existingRows.map((r) => r.sourceMessageId).filter(Boolean));
    const existingHashes = new Set(existingRows.map((r) => r.contentHash));

    async function processMessage(msg: (typeof normalized)[number]) {
      try {
        // contentHash is only a fallback identity for messages lacking a real
        // sourceMessageId -- it is NOT safe as an independent OR condition here,
        // since two genuinely distinct messages (e.g. identical short reactions
        // posted in the same minute) can hash identically.
        const existing = msg.sourceMessageId
          ? existingSourceIds.has(msg.sourceMessageId)
          : existingHashes.has(msg.contentHash);
        if (existing) {
          summary.duplicates++;
          return;
        }

        if (options.dryRun) {
          summary.imported++;
          return;
        }

        const dayDate = toUtcMidnight(msg.timestamp);
        const marketDayId = await getOrCreateMarketDay(dayDate);

        const created = await prisma.marketMessage.create({
          data: {
            marketDayId,
            sourceChannel: msg.sourceChannel,
            analysisType: msg.analysisType,
            author: msg.author,
            timestamp: msg.timestamp,
            content: msg.content,
            sourceMessageId: msg.sourceMessageId,
            sourceFile: msg.sourceFile,
            contentHash: msg.contentHash,
            instruments: {
              create: msg.instruments.map((instrument) => ({ instrument })),
            },
          },
        });

        // Attachment uploads are network-bound (original + thumbnail per image) --
        // run them concurrently per message rather than one at a time.
        await Promise.all(
          msg.attachments.map(async (att, i) => {
            try {
              const extracted = await withTimeout(
                extractAndUploadAttachment({
                  exportDir: options.exportDir,
                  filesDir: parsed.filesDir,
                  relativeFilePath: att.relativeFilePath,
                  originalFilename: att.originalFilename,
                  marketDayId,
                  messageId: created.id,
                  attachmentIndex: i,
                }),
                30000,
                `attachment upload ${att.originalFilename}`
              );
              if (!extracted) {
                summary.errors++;
                summary.errorDetail.push({
                  file: fileName,
                  reason: `Missing attachment file on disk: ${att.originalFilename} (message ${msg.sourceMessageId})`,
                });
                return;
              }
              await prisma.marketAttachment.create({ data: { messageId: created.id, ...extracted } });
            } catch (err) {
              summary.errors++;
              summary.errorDetail.push({
                file: fileName,
                reason: `Attachment upload failed: ${att.originalFilename} -- ${(err as Error).message}`,
              });
            }
          })
        );

        summary.imported++;
      } catch (err) {
        summary.errors++;
        summary.errorDetail.push({
          file: fileName,
          reason: `Message import failed (sourceMessageId ${msg.sourceMessageId}): ${(err as Error).message}`,
        });
      }
    }

    // Process messages with bounded concurrency -- fully sequential was the
    // other major cost on files with hundreds/thousands of messages.
    const CONCURRENCY = 8;
    for (let i = 0; i < normalized.length; i += CONCURRENCY) {
      await Promise.all(normalized.slice(i, i + CONCURRENCY).map(processMessage));
    }

    summary.filesDone++;
    console.log(
      `[${summary.filesDone}/${summary.filesTotal}] ${fileName} -- imported ${summary.imported}, dup ${summary.duplicates}, err ${summary.errors}`
    );

    if (options.importRunId) {
      await prisma.marketImportRun.update({
        where: { id: options.importRunId },
        data: {
          filesDone: summary.filesDone,
          imported: summary.imported,
          duplicates: summary.duplicates,
          errors: summary.errors,
          // Cap persisted error detail to avoid unbounded JSON growth on a bad export.
          errorDetail: summary.errorDetail.slice(0, 200) as unknown as object,
        },
      });
    }
  }

  return summary;
}
