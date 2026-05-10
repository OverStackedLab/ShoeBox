// Requires the `avatars` storage bucket and RLS policies — see docs/SUPABASE_SETUP.md.
import { decode } from "base64-arraybuffer"

import { supabase } from "./supabase"

export async function uploadAvatar(
  userId: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType === "image/png" ? "png" : "jpg"
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, decode(base64), { contentType: mimeType, upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from("avatars").getPublicUrl(path)
  // Bust cache so the new image is fetched immediately
  return `${data.publicUrl}?t=${Date.now()}`
}
