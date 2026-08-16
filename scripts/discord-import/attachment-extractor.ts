import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { uploadMarketAttachment } from "../../lib/supabase/market-research-storage";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const THUMBNAIL_WIDTH = 480;
const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
};

export interface ExtractedAttachment {
  storageKey: string;
  thumbnailStorageKey: string | null;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  checksum: string;
}

/**
 * Resolves an attachment's on-disk file within a DiscordChatExporter export's
 * `<file>.html_Files/` directory, uploads the original + (for images) a
 * generated thumbnail to the private market-research bucket, and returns
 * metadata for the MarketAttachment row.
 *
 * Returns null if the source file is missing on disk (orphaned/corrupt
 * attachment per PRD section 52) -- the caller records this as an import
 * error and continues, never aborting the run.
 */
export async function extractAndUploadAttachment(params: {
  exportDir: string;
  filesDir: string;
  relativeFilePath: string;
  originalFilename: string;
  marketDayId: string;
  messageId: string;
  attachmentIndex: number;
}): Promise<ExtractedAttachment | null> {
  const absPath = path.join(params.exportDir, params.filesDir, path.basename(params.relativeFilePath));

  let buffer: Buffer;
  try {
    buffer = await readFile(absPath);
  } catch {
    return null;
  }

  const ext = path.extname(params.originalFilename).toLowerCase() || path.extname(absPath).toLowerCase();
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const storageKey = `${params.marketDayId}/${params.messageId}/${params.attachmentIndex}${ext}`;

  let width: number | null = null;
  let height: number | null = null;
  let thumbnailStorageKey: string | null = null;
  let mimeType = MIME_BY_EXT[ext] ?? "application/octet-stream";

  if (IMAGE_EXT.has(ext)) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
      mimeType = metadata.format ? `image/${metadata.format}` : mimeType;

      const thumbBuffer = await sharp(buffer)
        .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
      thumbnailStorageKey = `${params.marketDayId}/${params.messageId}/${params.attachmentIndex}-thumb.jpg`;
      await uploadMarketAttachment(thumbnailStorageKey, thumbBuffer, "image/jpeg");
    } catch {
      // Corrupt/unreadable image: keep the original upload, skip the thumbnail.
      thumbnailStorageKey = null;
    }
  }

  await uploadMarketAttachment(storageKey, buffer, mimeType);

  return {
    storageKey,
    thumbnailStorageKey,
    originalFilename: params.originalFilename,
    mimeType,
    fileSize: buffer.byteLength,
    width,
    height,
    checksum,
  };
}
