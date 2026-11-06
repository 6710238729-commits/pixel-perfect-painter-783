import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { communityQuery } from "@/lib/community.functions";
import { reviewSchema } from "@/lib/community-rules";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reviews")({
  head: () => ({ meta: [{ title: "Reviews — รีวิวเว็บไซต์ FRAMELESS." }, { name: "description", content: "ความคิดเห็นและคะแนนเว็บไซต์ FRAMELESS. จากผู้เรียน" }, { property: "og:title", content: "Reviews — FRAMELESS." }, { property: "og:description", content: "รีวิวประสบการณ์เรียนจากสมาชิก FRAMELESS." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(communityQuery), component: Reviews,
});

function Reviews() {
  const { data } = useSuspenseQuery(communityQuery);
  const { user, ready } = useSession();
  const qc = useQueryClient();
  const { data: own, isLoading, error } = useQuery({ queryKey: ["own-review", user?.id], enabled: Boolean(user), queryFn: async () => {
    if (!user) return null;
    const result = await supabase.from("site_reviews").select("*").eq("user_id", user.id).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  } });
  const average = data.reviews.length ? (data.reviews.reduce((a, r) => a + r.rating, 0) / data.reviews.length).toFixed(1) : "—";
  return <main className="mx-auto max-w-5xl px-5 pt-40"><p className="text-sm text-cyan">เสียงจากผู้เรียน</p><h1 className="mt-2 text-4xl font-bold">Reviews</h1>
    <div className="my-8 flex items-baseline gap-3"><span className="text-5xl font-bold text-cyan">{average}</span><span className="text-muted-foreground">/ 5 · {data.reviews.length} รีวิว</span></div>
    <section className="border-y border-border py-8">
      <h2 className="mb-5 text-xl font-semibold">รีวิวเว็บไซต์ของคุณ</h2>
      {!ready || isLoading ? <p className="text-muted-foreground">กำลังโหลด…</p> : error ? <p role="alert" className="text-destructive">โหลดรีวิวของคุณไม่สำเร็จ</p> : !user ? <Button asChild><Link to="/auth">เข้าสู่ระบบเพื่อรีวิว</Link></Button> : <ReviewForm key={own?.id ?? user.id} own={own} userId={user.id} done={async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["community"] }), qc.invalidateQueries({ queryKey: ["own-review"] })]); }} />}
    </section>
    <div className="mt-8 grid gap-4 md:grid-cols-2">{data.reviews.map((r) => <article key={r.id} className="min-w-0 rounded-lg border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><h3 className="break-words font-semibold">{r.display_name}</h3><span className="flex shrink-0 items-center gap-1 text-cyan"><Star className="size-4" fill="currentColor" />{r.rating}/5</span></div><p className="mt-3 whitespace-pre-wrap break-words text-muted-foreground">{r.comment}</p><p className="mt-4 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("th-TH")}</p></article>)}</div>
    {!data.reviews.length && <p className="mt-8 text-muted-foreground">ยังไม่มีรีวิว</p>}
  </main>;
}

function ReviewForm({ own, userId, done }: { own?: { id: string; display_name: string; rating: number; comment: string } | null; userId: string; done: () => Promise<void> }) {
  const [name, setName] = useState(own?.display_name ?? "");
  const [rating, setRating] = useState(own?.rating ?? 5);
  const [comment, setComment] = useState(own?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const parsed = reviewSchema.parse({ display_name: name, rating, comment });
      const result = await supabase.from("site_reviews").upsert({ ...parsed, user_id: userId }, { onConflict: "user_id" });
      if (result.error) throw new Error("บันทึกรีวิวไม่สำเร็จ");
      await done(); toast.success("บันทึกรีวิวแล้ว");
    } catch (err) { toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ"); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!own || !window.confirm("ลบรีวิวของคุณหรือไม่?")) return;
    setBusy(true);
    try { const { error } = await supabase.from("site_reviews").delete().eq("id", own.id); if (error) throw error; await done(); toast.success("ลบรีวิวแล้ว"); } catch { toast.error("ลบรีวิวไม่สำเร็จ"); } finally { setBusy(false); }
  };
  return <form onSubmit={save} className="max-w-xl space-y-4"><label className="block text-sm">ชื่อที่แสดง<input aria-label="ชื่อที่แสดง" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="mt-2 w-full rounded-md border border-input bg-background p-3" /></label>
    <div role="group" aria-label="คะแนนรีวิว" className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <Button key={n} type="button" size="icon" variant="ghost" aria-label={`${n} ดาว`} aria-pressed={rating === n} onClick={() => setRating(n)} className={n <= rating ? "text-cyan" : "text-muted-foreground"}><Star fill={n <= rating ? "currentColor" : "none"} /></Button>)}</div>
    <label className="block text-sm">ความคิดเห็น<textarea aria-label="ความคิดเห็นรีวิว" value={comment} onChange={(e) => setComment(e.target.value)} required maxLength={2000} rows={4} className="mt-2 w-full rounded-md border border-input bg-background p-3" /></label>
    <div className="flex gap-3"><Button disabled={busy} type="submit">{busy ? "กำลังบันทึก…" : own ? "บันทึกการแก้ไขรีวิว" : "ส่งรีวิว"}</Button>{own && <Button disabled={busy} type="button" variant="outline" onClick={remove}><Trash2 />ลบรีวิว</Button>}</div>
  </form>;
}