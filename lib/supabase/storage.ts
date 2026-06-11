import { createClient } from "./client";

export const SCREENSHOTS_BUCKET = "screenshots";

export async function uploadScreenshot(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(SCREENSHOTS_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(SCREENSHOTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteScreenshot(url: string): Promise<void> {
  const supabase = createClient();
  const path = url.split(`/${SCREENSHOTS_BUCKET}/`)[1];
  if (!path) return;
  await supabase.storage.from(SCREENSHOTS_BUCKET).remove([path]);
}
