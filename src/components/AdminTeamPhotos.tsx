import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Upload, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { team } from "@/lib/team";
import { COURSE_COVER_BUCKET, courseCoverError } from "@/lib/course-cover";
import { CourseCover } from "@/components/CourseCover";
import { Button } from "@/components/ui/button";

export function AdminTeamPhotos() {
  const { data, isLoading, error } = useQuery({ queryKey: ["team-photos"], queryFn: async () => {
    const { data, error } = await supabase.from("team_photos").select("id, photo_path");
    if (error) throw error;
    return data;
  } });
  return <section className="mt-12 border-t border-border pt-8">
    <h2 className="flex items-center gap-2 text-2xl font-semibold"><Users />รูปทีมผู้สอน</h2>
    {isLoading ? <p className="mt-4 text-muted-foreground">กำลังโหลด…</p> : error ? <p role="alert" className="mt-4 text-destructive">โหลดรูปทีมไม่สำเร็จ</p> : <div className="mt-5 grid gap-5 sm:grid-cols-3">{team.map((m) => <TeamPhotoEditor key={m.id} member={m} path={data?.find((p) => p.id === m.id)?.photo_path ?? null} />)}</div>}
  </section>;
}

function TeamPhotoEditor({ member, path }: { member: typeof team[number]; path: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const change = async (file?: File) => {
    if (file) { const error = courseCoverError(file); if (error) { toast.error(error); return; } }
    setBusy(true);
    let newPath: string | null = null;
    try {
      if (file) {
        newPath = `team/${member.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
        const { error } = await supabase.storage.from(COURSE_COVER_BUCKET).upload(newPath, file, { contentType: file.type });
        if (error) throw error;
      }
      const { error } = await supabase.from("team_photos").upsert({ id: member.id, photo_path: newPath });
      if (error) { if (newPath) await supabase.storage.from(COURSE_COVER_BUCKET).remove([newPath]); throw error; }
      await qc.invalidateQueries({ queryKey: ["team-photos"] });
      if (path) await supabase.storage.from(COURSE_COVER_BUCKET).remove([path]);
      toast.success(file ? "เปลี่ยนรูปทีมแล้ว" : "นำรูปทีมออกแล้ว");
    } catch { toast.error("บันทึกรูปทีมไม่สำเร็จ กรุณาลองใหม่"); }
    finally { setBusy(false); }
  };
  return <article className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="relative aspect-[4/3] bg-secondary"><CourseCover path={path} title={member.name} /></div>
    <div className="space-y-3 p-4"><h3 className="font-semibold">{member.name}</h3><div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}><Upload />{busy ? "กำลังบันทึก…" : "เปลี่ยนรูปทีม"}</Button>
      {path && <Button variant="ghost" size="icon" title="นำรูปทีมออก" aria-label={`นำรูปทีม ${member.name} ออก`} disabled={busy} onClick={() => void change()}><Trash2 /></Button>}
      <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" aria-label={`เลือกรูปทีม ${member.name}`} disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void change(file); e.target.value = ""; }} />
    </div></div>
  </article>;
}