import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import type { fetchSubmissions } from "@/lib/community.functions";
import { feedbackSchema } from "@/lib/community-rules";
import { supabase } from "@/integrations/supabase/client";
import { WorkMedia } from "./WorkMedia";
import { Button } from "./ui/button";

type Row = Awaited<ReturnType<typeof fetchSubmissions>>["rows"][number];
export function SubmissionList({ rows, admin = false, userId, done }: { rows: Row[]; admin?: boolean; userId: string; done: () => Promise<void> }) {
  return rows.length ? <div className="grid gap-6 md:grid-cols-2">{rows.map((r) => <Submission key={r.id} r={r} admin={admin} userId={userId} done={done} />)}</div> : <p className="text-muted-foreground">ยังไม่มีงานที่ส่ง</p>;
}
function Submission({ r, admin, userId, done }: { r: Row; admin: boolean; userId: string; done: () => Promise<void> }) {
  const feedback = r.work_feedback;
  const [comment, setComment] = useState(feedback?.comment ?? "");
  const [status, setStatus] = useState<"reviewed" | "revision">(feedback?.status === "revision" ? "revision" : "reviewed");
  const [busy, setBusy] = useState(false);
  const review = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const parsed = feedbackSchema.parse({ status, comment }); const { error } = await supabase.from("work_feedback").upsert({ ...parsed, submission_id: r.id, admin_id: userId, updated_at: new Date().toISOString() }); if (error) throw error; await done(); toast.success("บันทึกความคิดเห็นแล้ว"); } catch { toast.error("บันทึกความคิดเห็นไม่สำเร็จ กรุณาใส่ความคิดเห็น"); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm("ลบงานที่ส่งนี้หรือไม่?")) return;
    setBusy(true);
    try { const { error } = await supabase.from("work_submissions").delete().eq("id", r.id); if (error) throw error; if (r.media_path) await supabase.storage.from("learning-works").remove([r.media_path]); await done(); toast.success("ลบงานแล้ว"); } catch { toast.error("ลบงานไม่สำเร็จ"); } finally { setBusy(false); }
  };
  return <article className="min-w-0 rounded-lg border border-border bg-card p-4">
    {r.media_path && <WorkMedia path={r.media_path} type={r.media_type ?? "image"} title={r.title} />}
    <div className="mt-4 flex items-start justify-between gap-3"><h3 className="break-words text-lg font-semibold">{r.title}</h3><span className="shrink-0 text-xs text-cyan">{feedback ? feedback.status === "revision" ? "ให้แก้ไข" : "ตรวจแล้ว" : "รอตรวจ"}</span></div>
    <p className="mt-1 text-sm text-muted-foreground">{r.courses?.title} · {new Date(r.created_at).toLocaleDateString("th-TH")}</p>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm">{r.description}</p>
    {r.work_url && <Button asChild variant="link" className="mt-2 px-0"><a href={r.work_url} target="_blank" rel="noopener noreferrer"><ExternalLink />เปิดผลงาน</a></Button>}
    {feedback && <div className="mt-4 border-l-2 border-cyan pl-3"><p className="text-xs text-cyan">ความคิดเห็นจากแอดมิน</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{feedback.comment}</p></div>}
    {admin ? <form onSubmit={review} className="mt-5 space-y-3"><label className="block text-sm">ผลการตรวจ<select aria-label={`ผลการตรวจ ${r.title}`} value={status} onChange={(e) => setStatus(e.target.value === "revision" ? "revision" : "reviewed")} className="mt-2 w-full rounded-md border border-input bg-background p-2"><option value="reviewed">ตรวจแล้ว</option><option value="revision">ให้แก้ไข</option></select></label><textarea aria-label={`ความคิดเห็น ${r.title}`} value={comment} onChange={(e) => setComment(e.target.value)} required maxLength={2000} placeholder="ความคิดเห็นถึงผู้เรียน" rows={3} className="w-full rounded-md border border-input bg-background p-3" /><Button disabled={busy} type="submit">บันทึกผลตรวจ</Button></form> : <Button onClick={remove} disabled={busy} variant="outline" className="mt-4"><Trash2 />ลบงานที่ส่ง</Button>}
  </article>;
}