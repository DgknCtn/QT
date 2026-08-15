import * as cheerio from "cheerio";
import { readFileSync } from "node:fs";
import path from "node:path";

// DiscordChatExporter renders Turkish weekday/month names when the export
// locale is tr-TR (confirmed against a real sample export in this workspace).
const TR_MONTHS: Record<string, number> = {
  Ocak: 0,
  Şubat: 1,
  Mart: 2,
  Nisan: 3,
  Mayıs: 4,
  Haziran: 5,
  Temmuz: 6,
  Ağustos: 7,
  Eylül: 8,
  Ekim: 9,
  Kasım: 10,
  Aralık: 11,
};

export interface ParsedAttachment {
  originalFilename: string;
  /** Decoded relative path (within the export's `<file>.html_Files/` dir) to the attachment. */
  relativeFilePath: string;
}

export interface ParsedMessage {
  sourceMessageId: string;
  author: string;
  /** Raw title text, e.g. "6 Ağustos 2026 Perşembe 16:06" -- parsed by parseTurkishTimestamp. */
  timestampRaw: string;
  contentText: string;
  attachments: ParsedAttachment[];
}

export interface ParsedExport {
  sourceFile: string;
  filesDir: string;
  timezoneOffsetHours: number;
  messages: ParsedMessage[];
}

export type AnalysisType = "PRE_MARKET" | "INTRADAY" | "EOD" | "EOW";

/**
 * Parses a DiscordChatExporter timestamp title string. These are always local
 * to the export's stated timezone (see the postamble "Timezone: UTC+N" line),
 * so we convert to a UTC epoch by subtracting that offset.
 */
export function parseTurkishTimestamp(raw: string, tzOffsetHours: number): Date {
  const match = raw.match(
    /(\d{1,2})\s+(\S+)\s+(\d{4})\s+\S+\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/u
  );
  if (!match) throw new Error(`Unparseable timestamp: "${raw}"`);
  const [, dayStr, monthName, yearStr, hourStr, minStr, secStr] = match;
  const month = TR_MONTHS[monthName];
  if (month === undefined) {
    throw new Error(`Unknown Turkish month name "${monthName}" in timestamp "${raw}"`);
  }
  const day = Number(dayStr);
  const year = Number(yearStr);
  const hour = Number(hourStr);
  const minute = Number(minStr);
  const second = secStr ? Number(secStr) : 0;
  return new Date(Date.UTC(year, month, day, hour - tzOffsetHours, minute, second));
}

/**
 * Maps an export filename to one of the four supported Market Research
 * source channels. Returns null for exports outside the supported set
 * (PRD non-goal: only these four channels are imported).
 */
export function resolveChannelAndAnalysisType(
  sourceFileName: string
): { sourceChannel: string; analysisType: AnalysisType } | null {
  const lower = sourceFileName.toLowerCase();
  if (lower.includes("pre-market-analizi")) {
    return { sourceChannel: "pre-market-analizi", analysisType: "PRE_MARKET" };
  }
  if (lower.includes("market-intraday")) {
    return { sourceChannel: "market-intraday", analysisType: "INTRADAY" };
  }
  if (lower.includes("eow")) {
    return { sourceChannel: "eow", analysisType: "EOW" };
  }
  if (lower.includes("eod")) {
    return { sourceChannel: "eod", analysisType: "EOD" };
  }
  return null;
}

/**
 * Parses a single DiscordChatExporter HTML export file into structured messages.
 * Does not touch the DB or storage -- pure parsing, safe to unit-test/dry-run.
 */
export function parseExportFile(filePath: string): ParsedExport {
  const html = readFileSync(filePath, "utf-8");
  const $ = cheerio.load(html);
  const sourceFile = path.basename(filePath);
  const filesDir = `${sourceFile}_Files`;

  const tzText = $(".postamble__entry")
    .filter((_, el) => $(el).text().includes("Timezone"))
    .first()
    .text();
  const tzMatch = tzText.match(/UTC([+-]\d+)/);
  const timezoneOffsetHours = tzMatch ? Number(tzMatch[1]) : 0;

  const messages: ParsedMessage[] = [];

  $(".chatlog__message-group").each((_, group) => {
    // Discord groups consecutive messages from the same author; only the
    // group's first message carries the full author header.
    let currentAuthor = "Unknown";

    $(group)
      .find(".chatlog__message-container")
      .each((_, container) => {
        const $container = $(container);
        const sourceMessageId = $container.attr("data-message-id");
        if (!sourceMessageId) return;

        const authorEl = $container.find(".chatlog__author").first();
        if (authorEl.length) {
          currentAuthor = authorEl.text().trim() || currentAuthor;
        }

        let timestampRaw = $container.find(".chatlog__timestamp").first().attr("title");
        if (!timestampRaw) {
          timestampRaw = $container.find(".chatlog__short-timestamp").first().attr("title");
        }
        // System notifications and other timestamp-less entries are skipped;
        // Market Research only cares about authored chat messages.
        if (!timestampRaw) return;

        const contentEl = $container.find(".chatlog__content.chatlog__markdown").first();
        const contentText = contentEl.length ? contentEl.text().trim() : "";

        const attachments: ParsedAttachment[] = [];
        $container
          .find(".chatlog__attachment img.chatlog__attachment-media")
          .each((_, img) => {
            const $img = $(img);
            const src = $img.attr("src");
            const title = $img.attr("title") ?? "";
            if (!src) return;
            const decoded = decodeURIComponent(src);
            const originalFilename =
              title.match(/Image:\s*(.+?)\s*\(/)?.[1]?.trim() ?? path.basename(decoded);
            attachments.push({ originalFilename, relativeFilePath: decoded });
          });

        messages.push({ sourceMessageId, author: currentAuthor, timestampRaw, contentText, attachments });
      });
  });

  return { sourceFile, filesDir, timezoneOffsetHours, messages };
}
