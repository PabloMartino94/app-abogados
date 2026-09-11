import { createClient } from "@supabase/supabase-js";

const BUCKET = "case-files";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "SUPABASE_URL / SUPABASE_ANON_KEY not set — file uploads will fail until configured."
  );
}

const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
}

export async function downloadFile(
  key: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const { data, error } = await supabase.storage.from(BUCKET).download(key);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: data.type || "application/octet-stream",
  };
}

export async function deleteFile(key: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([key]);
}
