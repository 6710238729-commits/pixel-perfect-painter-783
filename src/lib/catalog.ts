import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { Course, Level } from "@/lib/data";

export interface DbLesson { id: string; title: string; duration: string; free: boolean; video_url: string | null; position: number }
export type CatalogCourse = Course & { lessons: DbLesson[]; sort: number };

export const fetchCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogCourse[]> => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
  const sb = createClient(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: key.startsWith("sb_") ? {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    } : undefined,
  });
  const { data, error } = await sb.from("courses").select("*, lessons(*)").order("sort").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    ...c, level: c.level as Level,
    lessons: [...(c.lessons ?? [])].sort((a, b) => a.position - b.position),
  }));
});

export const catalogQuery = queryOptions({ queryKey: ["catalog"], queryFn: () => fetchCatalog() });

/** video_url may be an external URL or "storage:<path>" inside the private videos bucket */
export const STORAGE_PREFIX = "storage:";
