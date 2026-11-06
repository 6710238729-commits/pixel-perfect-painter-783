import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { communityQuery } from "@/lib/community.functions";
import { WorkMedia } from "./WorkMedia";

export function ExampleGallery({ courseId }: { courseId?: string }) {
  const { data } = useSuspenseQuery(communityQuery);
  const rows = data.examples.filter((e) => !courseId || e.course_id === courseId);
  return rows.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((e) => <article key={e.id} className="min-w-0 rounded-lg border border-border bg-card p-3">
    <WorkMedia path={e.media_path} type={e.media_type} title={e.title} />
    <h3 className="mt-4 break-words text-lg font-semibold">{e.title}</h3>
    <Link to="/learn/$courseId" params={{ courseId: e.course_id }} className="mt-1 block text-sm text-cyan">{e.courses?.title}</Link>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{e.description}</p>
  </article>)}</div> : <p className="text-muted-foreground">ยังไม่มีตัวอย่างผลงาน</p>;
}