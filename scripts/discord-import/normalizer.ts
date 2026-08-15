import { createHash } from "node:crypto";
import { parseTurkishTimestamp } from "./parser";
import type { AnalysisType, ParsedAttachment, ParsedExport, ParsedMessage } from "./parser";

export type Instrument = "NQ" | "ES" | "YM";

export interface NormalizedMessage {
  sourceMessageId: string;
  sourceFile: string;
  sourceChannel: string;
  analysisType: AnalysisType;
  author: string;
  timestamp: Date;
  content: string;
  contentHash: string;
  instruments: Instrument[];
  attachments: ParsedAttachment[];
}

const INSTRUMENT_PATTERN = /\b(NQ|ES|YM)\b/g;

/** Import-time convenience only -- never mutates original content, per PRD 4.1/11. */
export function extractInstruments(content: string): Instrument[] {
  const found = new Set<Instrument>();
  for (const match of content.matchAll(INSTRUMENT_PATTERN)) {
    found.add(match[1] as Instrument);
  }
  return [...found];
}

/**
 * Deterministic dedup hash per PRD section 24. sourceMessageId (a real Discord
 * snowflake, confirmed present in DiscordChatExporter's data-message-id attr)
 * is the primary identity; this hash is the secondary/fallback safety net and
 * also guards against the same message appearing with a different export ID
 * scheme in the future.
 */
export function computeContentHash(input: {
  sourceChannel: string;
  timestamp: Date;
  author: string;
  content: string;
  attachmentFilenames: string[];
}): string {
  const normalizedContent = input.content.trim().replace(/\s+/g, " ");
  const parts = [
    input.sourceChannel,
    input.timestamp.toISOString(),
    input.author,
    normalizedContent,
    [...input.attachmentFilenames].sort().join(","),
  ];
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export function normalizeMessage(
  msg: ParsedMessage,
  ctx: {
    sourceFile: string;
    sourceChannel: string;
    analysisType: AnalysisType;
    timezoneOffsetHours: number;
  }
): NormalizedMessage {
  const timestamp = parseTurkishTimestamp(msg.timestampRaw, ctx.timezoneOffsetHours);
  const content = msg.contentText;
  const contentHash = computeContentHash({
    sourceChannel: ctx.sourceChannel,
    timestamp,
    author: msg.author,
    content,
    attachmentFilenames: msg.attachments.map((a) => a.originalFilename),
  });

  return {
    sourceMessageId: msg.sourceMessageId,
    sourceFile: ctx.sourceFile,
    sourceChannel: ctx.sourceChannel,
    analysisType: ctx.analysisType,
    author: msg.author,
    timestamp,
    content,
    contentHash,
    instruments: extractInstruments(content),
    attachments: msg.attachments,
  };
}

export function normalizeExport(
  parsed: ParsedExport,
  ctx: { sourceChannel: string; analysisType: AnalysisType }
): NormalizedMessage[] {
  return parsed.messages.map((m) =>
    normalizeMessage(m, {
      sourceFile: parsed.sourceFile,
      sourceChannel: ctx.sourceChannel,
      analysisType: ctx.analysisType,
      timezoneOffsetHours: parsed.timezoneOffsetHours,
    })
  );
}
