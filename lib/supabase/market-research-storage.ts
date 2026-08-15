import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

export const MARKET_RESEARCH_BUCKET = "market-research";

let adminClient: SupabaseClient | null = null;

/**
 * Server-only admin client. Requires SUPABASE_SERVICE_ROLE_KEY -- never import this
 * from client components. Used by the offline import script and by server actions
 * that generate signed URLs for the private market-research bucket.
 */
export function getMarketResearchAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to access the market-research bucket."
    );
  }
  adminClient = createAdminClient(url, serviceKey, {
    auth: { persistSession: false },
    // Only used server-side for storage uploads/signed URLs -- provide a ws-based
    // transport so client construction doesn't require native WebSocket (Node < 22).
    realtime: { transport: WebSocket as never },
  });
  return adminClient;
}

export async function uploadMarketAttachment(
  path: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<void> {
  const supabase = getMarketResearchAdminClient();
  const { error } = await supabase.storage
    .from(MARKET_RESEARCH_BUCKET)
    .upload(path, fileBuffer, { contentType, upsert: false });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }
}

export async function createSignedAttachmentUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = getMarketResearchAdminClient();
  const { data, error } = await supabase.storage
    .from(MARKET_RESEARCH_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(error?.message ?? "Failed to create signed URL");
  return data.signedUrl;
}

export async function createSignedAttachmentUrls(
  paths: string[],
  expiresInSeconds = 3600
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = getMarketResearchAdminClient();
  const { data, error } = await supabase.storage
    .from(MARKET_RESEARCH_BUCKET)
    .createSignedUrls(paths, expiresInSeconds);
  if (error || !data) throw new Error(error?.message ?? "Failed to create signed URLs");
  const map: Record<string, string> = {};
  for (const entry of data) {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  }
  return map;
}
