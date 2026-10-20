import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Crown, Plus, Trash2, Upload, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categories, thumb } from "@/lib/data";
import { STORAGE_PREFIX, type CatalogCourse, type DbLesson } from "@/lib/catalog";
import { CourseCover } from "@/components/CourseCover";
import { Button } from "@/components/ui/button";
import { COURSE_COVER_BUCKET, courseCoverError } from "@/lib/course-cover";
import { parseCoursePrice, coursePriceLabel } from "@/lib/course-price";
import { AdminTeamPhotos } from "@/components/AdminTeamPhotos";

export const Route = createFileRoute("/_authenticated/admin_/content")({
  head: () => ({
    meta: [
      { title: "จัดการคอร์ส — FRAMELESS." },
      { name: "description", content: "เพิ่ม แก้ไข ลบคอร์สและบทเรียน จัดการวิดีโอและเนื้อหา Premium" },
      { property: "og:title", content: "จัดการคอร์ส — FRAMELESS." },
      { property: "og:description", content: "ระบบจัดการเนื้อหาสำหรับแอดมิน" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContentAdmin,
});

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function useAdminCatalog() {
  return useQuery({
    queryKey: ["admin-catalog"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { isAdmin: false, courses: [] as CatalogCourse[] };
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (!isAdmin) return { isAdmin: false, courses: [] as CatalogCourse[] };
      const { data, error } = await supabase.from("courses").select("*, lessons(*)").order("sort").order("created_at");
      if (error) throw error;
      const courses = (data ?? []).map((c) => ({ ...c, lessons: [...c.lessons].sort((a, b) => a.position - b.position) })) as CatalogCourse[];
      return { isAdmin: true, courses };
    },
  });
}

function ContentAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useAdminCatalog();
  const [open, setOpen] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-catalog"] }); qc.invalidateQueries({ queryKey: ["catalog"] }); };

  if (isLoading) return <div className="pt-32 text-center text-muted-foreground">กำลังโหลด…</div>;
  if (!data?.isAdmin) return <div className="pt-32 text-center text-muted-foreground">หน้านี้สำหรับแอดมินเท่านั้น</div>;

  const addCourse = async () => {
    const id = `course-${Date.now().toString(36)}`;
    const { error } = await supabase.from("courses").insert({ id, title: "คอร์สใหม่", sort: data.courses.length, hue: 220 + ((data.courses.length * 37) % 100) });
    if (error) { toast.error(error.message); return; }
    toast.success("เพิ่มคอร์สแล้ว"); setOpen(id); refresh();
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">จัดการคอร์ส</h1>
          <p className="mt-2 text-sm text-muted-foreground">{data.courses.length} คอร์ส · <Link to="/admin" className="text-cyan underline">รายการเติมเงิน</Link></p>
        </div>
        <button onClick={addCourse} className="bg-gradient-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-primary-foreground"><Plus className="h-4 w-4" />เพิ่มคอร์ส</button>
      </div>
      <div className="mt-8 space-y-4">
        {data.courses.map((c) => (
          <CourseEditor key={c.id} c={c} open={open === c.id} toggle={() => setOpen(open === c.id ? null : c.id)} refresh={refresh} />
        ))}
      </div>
      <AdminTeamPhotos />
    </div>
  );
}

function CourseEditor({ c, open, toggle, refresh }: { c: CatalogCourse; open: boolean; toggle: () => void; refresh: () => void }) {
  const [f, setF] = useState({ title: c.title, category: c.category, level: c.level, duration: c.duration, description: c.description, hue: c.hue, premium: c.premium });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const [coverPath, setCoverPath] = useState(c.cover_path ?? null);
  const [price, setPrice] = useState(String(c.price ?? 0));
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  const changeCover = async (file?: File) => {
    if (file) {
      const message = courseCoverError(file);
      if (message) { toast.error(message); return; }
    }
    setCoverBusy(true);
    const oldPath = coverPath;
    let newPath: string | null = null;
    try {
      if (file) {
        newPath = `${c.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
        const { error } = await supabase.storage.from(COURSE_COVER_BUCKET).upload(newPath, file, { contentType: file.type });
        if (error) throw error;
      }
      const { error } = await supabase.from("courses").update({ cover_path: newPath }).eq("id", c.id);
      if (error) {
        if (newPath) await supabase.storage.from(COURSE_COVER_BUCKET).remove([newPath]);
        throw error;
      }
      setCoverPath(newPath);
      refresh();
      if (oldPath) await supabase.storage.from(COURSE_COVER_BUCKET).remove([oldPath]);
      toast.success(file ? "เปลี่ยนรูปปกแล้ว" : "นำรูปปกออกแล้ว");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เปลี่ยนรูปปกไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally { setCoverBusy(false); }
  };

  const save = async () => {
    const amount = parseCoursePrice(price);
    if (amount === null) { toast.error("ราคาต้องเป็นจำนวนเต็มตั้งแต่ 0 บาทขึ้นไป"); return; }
    setSaving(true);
    const { error } = await supabase.from("courses").update({ ...f, price: amount }).eq("id", c.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("บันทึกคอร์สแล้ว"); refresh();
  };
  const remove = async () => {
    if (!confirm(`ลบคอร์ส "${c.title}" และบทเรียนทั้งหมด?`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("ลบคอร์สแล้ว"); refresh();
  };
  const addLesson = async () => {
    const { error } = await supabase.from("lessons").insert({ course_id: c.id, title: `บทที่ ${c.lessons.length + 1}`, position: c.lessons.length });
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <button onClick={toggle} className="flex w-full items-center gap-4 p-4 text-left">
        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg" style={{ background: thumb(c.hue) }}><CourseCover path={coverPath} title={c.title} /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 font-semibold">{c.title}{c.premium && <Crown className="h-4 w-4 text-cyan" />}</div>
          <div className="text-xs text-muted-foreground">{c.category} · {c.lessons.length} บทเรียน · {c.premium ? "Premium" : "Free"} · {coursePriceLabel(c)}</div>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="space-y-5 border-t border-border p-5">
          <div className="space-y-3">
            <div className="text-sm font-medium">รูปปกคอร์ส</div>
            <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg" style={{ background: thumb(f.hue) }}>
              <CourseCover path={coverPath} title={f.title} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" disabled={coverBusy} onClick={() => coverInput.current?.click()}><Upload />{coverBusy ? "กำลังบันทึก…" : "เปลี่ยนรูปปก"}</Button>
              {coverPath && <Button variant="ghost" disabled={coverBusy} onClick={() => changeCover()}><Trash2 />นำรูปออก</Button>}
              <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label={`เลือกรูปปก ${c.title}`} hidden disabled={coverBusy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void changeCover(file); e.target.value = ""; }} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-muted-foreground">ชื่อคอร์ส<input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">หมวดหมู่
              <select className={input} value={f.category} onChange={(e) => set("category", e.target.value)}>{categories.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <label className="text-xs text-muted-foreground">ระดับ
              <select className={input} value={f.level} onChange={(e) => set("level", e.target.value as typeof f.level)}>{LEVELS.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <label className="text-xs text-muted-foreground">ความยาวรวม<input className={input} value={f.duration} placeholder="2h 10m" onChange={(e) => set("duration", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground md:col-span-2">คำอธิบาย<textarea rows={2} className={input} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">สีปก ({f.hue})<input type="range" min={0} max={360} value={f.hue} onChange={(e) => set("hue", Number(e.target.value))} className="w-full" /></label>
            <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={f.premium} onChange={(e) => set("premium", e.target.checked)} /> คอร์ส Premium (บทเรียนที่ไม่ได้ติ๊ก "ฟรี" จะถูกล็อก)</label>
             {f.premium && <label className="text-xs text-muted-foreground">ราคาคอร์ส Premium (บาท / เครดิต)<input type="number" min={0} step={1} className={input} value={price} onChange={(e) => setPrice(e.target.value)} /><span className="mt-1 block">1 บาท = 1 เครดิต</span></label>}
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกคอร์ส"}</Button>
            <button onClick={remove} className="inline-flex items-center gap-1 rounded-full border border-destructive px-4 py-2 text-sm text-destructive"><Trash2 className="h-4 w-4" />ลบคอร์ส</button>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">บทเรียน</h3>
              <button onClick={addLesson} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs"><Plus className="h-3 w-3" />เพิ่มบทเรียน</button>
            </div>
            <div className="space-y-2">
              {c.lessons.map((l, i) => <LessonRow key={l.id} l={l} courseId={c.id} prev={c.lessons[i - 1]} next={c.lessons[i + 1]} premium={f.premium} refresh={refresh} />)}
              {c.lessons.length === 0 && <div className="text-sm text-muted-foreground">ยังไม่มีบทเรียน</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonRow({ l, courseId, prev, next, premium, refresh }: { l: DbLesson; courseId: string; prev: DbLesson | undefined; next: DbLesson | undefined; premium: boolean; refresh: () => void }) {
  const [title, setTitle] = useState(l.title);
  const [duration, setDuration] = useState(l.duration);
  const [url, setUrl] = useState(l.video_url ?? "");
  const [busy, setBusy] = useState(false);

  const update = async (patch: Partial<DbLesson>) => {
    const { error } = await supabase.from("lessons").update(patch).eq("id", l.id);
    if (error) { toast.error(error.message); return false; }
    refresh(); return true;
  };
  const swap = async (o?: DbLesson) => {
    if (!o) return;
    await supabase.from("lessons").update({ position: o.position }).eq("id", l.id);
    await supabase.from("lessons").update({ position: l.position }).eq("id", o.id);
    refresh();
  };
  const remove = async () => {
    if (!confirm(`ลบบทเรียน "${l.title}"?`)) return;
    if (l.video_url?.startsWith(STORAGE_PREFIX)) await supabase.storage.from("videos").remove([l.video_url.slice(STORAGE_PREFIX.length)]);
    const { error } = await supabase.from("lessons").delete().eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  };
  const upload = async (file: File) => {
    setBusy(true);
    const path = `${courseId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); { toast.error(error.message); return; } }
    if (l.video_url?.startsWith(STORAGE_PREFIX)) await supabase.storage.from("videos").remove([l.video_url.slice(STORAGE_PREFIX.length)]);
    const v = STORAGE_PREFIX + path;
    setUrl(v);
    if (await update({ video_url: v })) toast.success("อัปโหลดวิดีโอแล้ว");
    setBusy(false);
  };

  const isFile = url.startsWith(STORAGE_PREFIX);
  return (
    <div className="rounded-xl border border-border bg-card/50 p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_100px_auto]">
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="ชื่อบทเรียน" />
        <input className={input} value={duration} placeholder="12:30" onChange={(e) => setDuration(e.target.value)} aria-label="ความยาว" />
        <div className="flex items-center gap-1">
          <button onClick={() => swap(prev)} disabled={!prev} aria-label="เลื่อนขึ้น" className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
          <button onClick={() => swap(next)} disabled={!next} aria-label="เลื่อนลง" className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
          <button onClick={remove} aria-label="ลบบทเรียน" className="rounded-lg border border-destructive p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Video className="h-4 w-4 text-muted-foreground" />
        <input className={`${input} flex-1`} value={isFile ? `ไฟล์ที่อัปโหลด: ${url.split("/").pop()}` : url} readOnly={isFile}
          placeholder="ลิงก์วิดีโอ (.mp4) หรืออัปโหลดไฟล์" onChange={(e) => setUrl(e.target.value)} aria-label="ลิงก์วิดีโอ" />
        {isFile && <button onClick={() => setUrl("")} className="text-xs text-muted-foreground underline">เปลี่ยนเป็นลิงก์</button>}
        <label className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-border px-3 py-2 text-xs ${busy ? "opacity-50" : ""}`}>
          <Upload className="h-3 w-3" />{busy ? "กำลังอัปโหลด…" : "อัปโหลด"}
          <input type="file" accept="video/*" hidden disabled={busy} onChange={(e) => { const fl = e.target.files?.[0]; if (fl) upload(fl); e.target.value = ""; }} />
        </label>
        <label className={`flex items-center gap-1.5 text-xs ${premium ? "" : "opacity-50"}`} title={premium ? "" : "คอร์สนี้ฟรีอยู่แล้ว"}>
          <input type="checkbox" checked={l.free} onChange={(e) => update({ free: e.target.checked })} /> ดูฟรี (ไม่ล็อก)
        </label>
        <button onClick={async () => { if (await update({ title, duration, video_url: url || null })) toast.success("บันทึกบทเรียนแล้ว"); }}
          className="bg-gradient-accent rounded-full px-4 py-2 text-xs text-primary-foreground">บันทึก</button>
      </div>
    </div>
  );
}
