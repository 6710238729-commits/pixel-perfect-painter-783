import { Link } from "@tanstack/react-router";
import { Clock, Layers, Lock, Play } from "lucide-react";
import { type Course, thumb } from "@/lib/data";
import { CourseCover } from "@/components/CourseCover";

export function CourseCard({ c }: { c: Course }) {
  return (
    <Link to="/learn/$courseId" params={{ courseId: c.id }}
      className="lift group block overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-video" style={{ background: thumb(c.hue) }}>
        {c.cover_path ? <CourseCover path={c.cover_path} title={c.title} /> : <div className="absolute inset-0 grid-bg opacity-30" />}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${c.premium ? "bg-gradient-accent text-primary-foreground" : "glass"}`}>
          {c.premium ? "Premium" : "Free"}
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="glass flex h-14 w-14 items-center justify-center rounded-full">
            {c.premium ? <Lock className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="text-xs uppercase tracking-widest text-cyan">{c.level}</div>
        <h3 className="mt-1.5 text-base font-semibold">{c.title}</h3>
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{c.duration}</span>
          <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{c.lessons.length} บทเรียน</span>
        </div>
      </div>
    </Link>
  );
}
