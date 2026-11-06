import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { catalogQuery } from "@/lib/catalog";
import { communityQuery, fetchSubmissions } from "@/lib/community.functions";
import { useSession } from "@/hooks/use-session";
import { WorkForm } from "@/components/WorkForm";
import { SubmissionList } from "@/components/SubmissionList";
import { WorkMedia } from "@/components/WorkMedia";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin_/works")({
  head: () => ({ meta: [{ title: "จัดการผลงาน — แอดมิน FRAMELESS." }, { name: "description", content: "เพิ่มตัวอย่างผลงานและตรวจผลงานจากผู้เรียน" }, { property: "og:title", content: "จัดการผลงาน — FRAMELESS." }, { property: "og:description", content: "จัดการตัวอย่างผลงานและผลตรวจ" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(catalogQuery), context.queryClient.ensureQueryData(communityQuery)]), component: AdminWorks,
});
function AdminWorks() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { data: community } = useSuspenseQuery(communityQuery);
  const { user } = useSession();
  const fetch = useServerFn(fetchSubmissions);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-submissions", user?.id], enabled: Boolean(user), queryFn: () => fetch() });
  const done = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["community"] }), qc.invalidateQueries({ queryKey: ["admin-submissions"] })]); };
  const remove = async (id: string, path: string) => {
    if (!window.confirm("ลบตัวอย่างผลงานนี้หรือไม่?")) return;
    const { error } = await supabase.from("course_examples").delete().eq("id", id);
    if (error) { toast.error("ลบตัวอย่างไม่สำเร็จ"); return; }
    await supabase.storage.from("learning-works").remove([path]); await done(); toast.success("ลบตัวอย่างแล้ว");
  };
  if (isLoading || !user) return <p className="pt-40 text-center">กำลังโหลด…</p>;
  if (error) return <p role="alert" className="pt-40 text-center text-destructive">โหลดข้อมูลไม่สำเร็จ</p>;
  if (!data?.isAdmin) return <p className="pt-40 text-center">หน้านี้สำหรับแอดมินเท่านั้น</p>;
  return <main className="mx-auto max-w-5xl px-5 pt-40"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-cyan">Admin</p><h1 className="mt-2 text-3xl font-bold">จัดการผลงาน</h1></div><Button asChild variant="outline"><Link to="/admin">กลับหน้าแอดมิน</Link></Button></div><section className="my-8 border-y border-border py-8"><h2 className="mb-5 text-xl font-semibold">เพิ่มตัวอย่างผลงานจากคอร์ส</h2><WorkForm userId={user.id} courses={catalog} example done={done} /></section>
    <h2 className="mb-5 text-2xl font-semibold">ตัวอย่างผลงานที่เผยแพร่</h2><div className="grid gap-5 md:grid-cols-2">{community.examples.map((e) => <article key={e.id} className="min-w-0 rounded-lg border border-border bg-card p-4"><WorkMedia path={e.media_path} type={e.media_type} title={e.title} /><h3 className="mt-3 break-words font-semibold">{e.title}</h3><p className="mt-1 text-sm text-muted-foreground">{e.courses?.title}</p><Button variant="outline" className="mt-4" onClick={() => remove(e.id, e.media_path)}><Trash2 />ลบตัวอย่าง</Button></article>)}</div>{!community.examples.length && <p className="text-muted-foreground">ยังไม่มีตัวอย่างผลงาน</p>}
    <section className="mt-12 border-t border-border pt-8"><h2 className="mb-6 text-2xl font-semibold">ผลงานจากผู้เรียน</h2><SubmissionList rows={data.rows} admin userId={user.id} done={done} /></section>
  </main>;
}