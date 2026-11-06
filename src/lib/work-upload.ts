import { supabase } from "@/integrations/supabase/client";
import { workFileError } from "./community-rules";

export async function uploadWork(file: File, userId: string) {
  const error = workFileError(file);
  if (error) throw new Error(error);
  const ext: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };
  const path = `${userId}/${crypto.randomUUID()}.${ext[file.type]}`;
  const result = await supabase.storage.from("learning-works").upload(path, file);
  if (result.error) throw new Error("อัปโหลดผลงานไม่สำเร็จ");
  return { media_path: path, media_type: file.type.startsWith("video/") ? "video" : "image" };
}