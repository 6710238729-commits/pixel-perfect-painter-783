import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const fetchCommunity = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) throw new Error("โหลดข้อมูลไม่สำเร็จ");
  const sb = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const [examples, reviews] = await Promise.all([
    sb.from("course_examples").select("id,course_id,title,description,media_path,media_type,created_at,courses(title)").order("created_at", { ascending: false }),
    sb.from("site_reviews").select("id,display_name,rating,comment,created_at").order("created_at", { ascending: false }),
  ]);
  if (examples.error || reviews.error) throw new Error("โหลดผลงานและรีวิวไม่สำเร็จ");
  return { examples: examples.data ?? [], reviews: reviews.data ?? [] };
});
export const communityQuery = queryOptions({ queryKey: ["community"], queryFn: () => fetchCommunity() });

export const fetchSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError) throw new Error("ตรวจสอบสิทธิ์ไม่สำเร็จ");
    let query = context.supabase.from("work_submissions").select("*,courses(title),work_feedback(*)").order("created_at", { ascending: false });
    if (!isAdmin) query = query.eq("user_id", context.userId);
    const { data, error } = await query;
    if (error) throw new Error("โหลดงานที่ส่งไม่สำเร็จ");
    return { isAdmin: Boolean(isAdmin), rows: data ?? [] };
  });