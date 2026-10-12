import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Bookmark, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { courses, sampleVideo } from "@/lib/data";

export const Route = createFileRoute("/learn/$courseId")({
  loader: ({ params }) => {
    const course = courses.find((c) => c.id === params.courseId);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.course.title} — FRAMELESS.` : "ไม่พบคอร์ส — FRAMELESS.";
    const d = loaderData?.course.description ?? "ไม่พบคอร์สนี้";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  notFoundComponent: () => <div className="pt-40 text-center">ไม่พบคอร์สนี้ <Link to="/courses" className="text-cyan">กลับไปหน้าคอร์ส</Link></div>,
  component: LearnPage,
});

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

function LearnPage() {
  const { course } = Route.useLoaderData();
  const [active, setActive] = useState(course.lessons[0]);
  const [speed, setSpeed] = useState(1);
  const [done, setDone] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const locked = course.premium && !active.free;

  useEffect(() => { if (ref.current) ref.current.playbackRate = speed; }, [speed, active]);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 pt-28 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-card">
          {locked ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Lock className="h-10 w-10 text-cyan" />
              <p className="font-display text-lg">บทเรียน Premium</p>
              <p className="text-sm text-muted-foreground">ปลดล็อกด้วยเครดิตใน Marketplace</p>
              <Link to="/marketplace" className="bg-gradient-accent mt-2 rounded-full px-5 py-2 text-sm text-primary-foreground">ไปที่ Marketplace</Link>
            </div>
          ) : (
            <video key={active.id} ref={ref} src={sampleVideo} controls className="h-full w-full" onEnded={() => setDone((d) => [...new Set([...d, active.id])])} />
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-cyan">{course.category}</div>
            <h1 className="mt-1 text-2xl font-bold">{course.title} · {active.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="glass rounded-full px-3 py-2 text-sm outline-none" aria-label="ความเร็ว">
              {SPEEDS.map((s) => <option key={s} value={s}>{s}x</option>)}
            </select>
            <button onClick={() => setSaved((s) => !s)} aria-label="Bookmark" className={`glass rounded-full p-2.5 transition-colors ${saved ? "text-cyan" : ""}`}>
              <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-muted-foreground">{course.description}</p>
      </div>

      <aside className="glass h-fit rounded-2xl p-3">
        <div className="px-3 py-2 text-sm text-muted-foreground">{done.length}/{course.lessons.length} บทเรียนเสร็จแล้ว</div>
        <ul className="max-h-[60vh] space-y-1 overflow-auto">
          {course.lessons.map((l) => {
            const lk = course.premium && !l.free;
            return (
              <li key={l.id}>
                <button onClick={() => setActive(l)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active.id === l.id ? "bg-secondary" : "hover:bg-secondary/60"}`}>
                  {done.includes(l.id) ? <CheckCircle2 className="h-4 w-4 text-cyan" /> : lk ? <Lock className="h-4 w-4 text-muted-foreground" /> : <PlayCircle className="h-4 w-4" />}
                  <span className="flex-1">{l.title}</span>
                  <span className="text-xs text-muted-foreground">{l.duration}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
