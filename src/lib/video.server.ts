export async function signedLessonVideo(raw: string | null): Promise<string | null> {
  if (!raw) return null;
  if (!raw.startsWith("storage:")) {
    const url = new URL(raw);
    if (url.protocol !== "https:") throw new Error("ลิงก์วิดีโอไม่ถูกต้อง");
    return raw;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from("videos").createSignedUrl(raw.slice(8), 300);
  if (error || !data) throw new Error("โหลดวิดีโอไม่สำเร็จ");
  // Browser-facing URL must use the public gateway, not the server-local origin.
  const publicOrigin = import.meta.env.VITE_SUPABASE_URL;
  const url = new URL(data.signedUrl);
  const gateway = new URL(publicOrigin);
  return `${gateway.origin}${gateway.pathname.replace(/\/$/, "")}${url.pathname}${url.search}`;
}