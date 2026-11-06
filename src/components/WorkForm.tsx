import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { safeWorkUrl, workFileError, workSchema } from "@/lib/community-rules";
import { uploadWork } from "@/lib/work-upload";
import { Button } from "./ui/button";

export function WorkForm({ userId, courses, example = false, done, initialCourse }: { userId: string; courses: { id: string; title: string }[]; example?: boolean; done: () => Promise<void>; initialCourse?: string }) {
  const [course, setCourse] = useState(initialCourse ?? courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(0);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); let path: string | undefined;
    try {
      const parsed = workSchema.parse({ title, description, course_id: course });
      const work_url = example ? null : safeWorkUrl(url);
      if (!file && (!work_url || example)) throw new Error("กรุณาเลือกไฟล์ผลงาน" + (example ? "" : "หรือใส่ลิงก์"));
      const media = file ? await uploadWork(file, userId) : null;
      path = media?.media_path;
      const result = example ? await supabase.from("course_examples").insert({ ...parsed, media_path: media?.media_path ?? "", media_type: media?.media_type ?? "image" }) : await supabase.from("work_submissions").insert({ ...parsed, user_id: userId, work_url, media_path: media?.media_path ?? null, media_type: media?.media_type ?? null });
      if (result.error) throw new Error("บันทึกผลงานไม่สำเร็จ กรุณาตรวจสิทธิ์คอร์สแล้วลองใหม่");
      path = undefined;
      setTitle(""); setDescription(""); setUrl(""); setFile(null); setReset((v) => v + 1);
      await done(); toast.success(example ? "เพิ่มตัวอย่างผลงานแล้ว" : "ส่งผลงานแล้ว");
    } catch (err) { if (path) await supabase.storage.from("learning-works").remove([path]); toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ"); } finally { setBusy(false); }
  };
  const input = "mt-2 w-full rounded-md border border-input bg-background p-3";
  return <form onSubmit={submit} className="max-w-2xl space-y-4">
    <label className="block text-sm">คอร์ส<select aria-label="คอร์สของผลงาน" value={course} onChange={(e) => setCourse(e.target.value)} required className={input}><option value="">เลือกคอร์ส</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
    <label className="block text-sm">ชื่อผลงาน<input aria-label="ชื่อผลงาน" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={160} className={input} /></label>
    <label className="block text-sm">รายละเอียด<textarea aria-label="รายละเอียดผลงาน" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} className={input} /></label>
    <label className="block text-sm">ไฟล์ผลงาน · JPG / PNG / WebP / MP4 / WebM · ไม่เกิน 100 MB<input key={reset} type="file" aria-label="ไฟล์ผลงาน" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className={input} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const error = workFileError(f); if (error) { toast.error(error); e.target.value = ""; setFile(null); return; } } setFile(f ?? null); }} /></label>
    {!example && <label className="block text-sm">ลิงก์ผลงาน (ถ้าไม่มีไฟล์)<input aria-label="ลิงก์ผลงาน" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" maxLength={2000} className={input} /></label>}
    <Button type="submit" disabled={busy || !courses.length}><Upload />{busy ? "กำลังส่ง…" : example ? "เพิ่มตัวอย่างผลงาน" : "ส่งผลงาน"}</Button>
  </form>;
}