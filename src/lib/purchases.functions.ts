import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminRole } from "@/lib/admin-access";
import { balanceInput, purchaseInput, purchaseError } from "@/lib/credit-rules";
import { signedLessonVideo } from "@/lib/video.server";

export const setMemberBalance = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => balanceInput.parse(d)).handler(async ({ data, context }) => {
    const { data: balance, error } = await context.supabase.rpc("set_member_balance", { _user_id: data.userId, _balance: data.balance, _note: data.note });
    if (error) throw new Error("บันทึกเครดิตไม่สำเร็จ กรุณาตรวจสอบสิทธิ์แอดมิน");
    return { balance };
  });

export const buyCourse = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => purchaseInput.parse(d)).handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("purchase_course", { _course_id: data.courseId, _expected_price: data.expectedPrice });
    if (error) throw new Error(purchaseError(error.message));
    return result;
  });

export const fetchPurchases = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [p, w, a] = await Promise.all([
    context.supabase.from("purchases").select("course_id,amount,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }),
    context.supabase.from("wallets").select("balance").eq("user_id", context.userId).single(),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (p.error || w.error || a.error) throw new Error("โหลดข้อมูลการซื้อไม่สำเร็จ");
  return { purchases: p.data, balance: w.data.balance, isAdmin: Boolean(a.data) };
});

export const fetchAdminCatalog = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  requireAdminRole(admin, Boolean(roleError));
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("courses").select("*,lessons(*)").order("sort");
  if (error) throw new Error("โหลดคอร์สไม่สำเร็จ");
  return data;
});

export const fetchMemberVideo = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lessonId: z.string().uuid() }).parse(d)).handler(async ({ data, context }) => {
    const { data: raw, error } = await context.supabase.rpc("lesson_video", { _lesson_id: data.lessonId });
    if (error) throw new Error("ต้องซื้อคอร์สก่อนดูบทเรียนนี้");
    return { src: await signedLessonVideo(raw) };
  });

export const fetchFreeVideo = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ lessonId: z.string().uuid() }).parse(d)).handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    const url = process.env["SUPABASE_URL"];
    if (!key || !url) throw new Error("โหลดวิดีโอไม่สำเร็จ");
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key); return fetch(input, { ...init, headers });
    } } });
    const { data: raw, error } = await client.rpc("lesson_video", { _lesson_id: data.lessonId });
    if (error) throw new Error("บทเรียนนี้เป็น Premium");
    return { src: await signedLessonVideo(raw) };
  });