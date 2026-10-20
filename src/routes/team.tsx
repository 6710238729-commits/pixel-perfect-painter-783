import { createFileRoute } from "@tanstack/react-router";
import { team } from "@/lib/team";
import { thumb } from "@/lib/data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CourseCover } from "@/components/CourseCover";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "ทีมของเรา — FRAMELESS." },
      { name: "description", content: "พบกับทีมผู้สอน After Effects ทั้ง 3 คนของ FRAMELESS." },
      { property: "og:title", content: "ทีมของเรา — FRAMELESS." },
      { property: "og:description", content: "ทีมผู้สร้างและผู้สอนของ FRAMELESS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data: photos } = useQuery({ queryKey: ["team-photos"], queryFn: async () => {
    const { data, error } = await supabase.from("team_photos").select("id, photo_path");
    if (error) throw error;
    return data;
  } });
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32">
      <h1 className="reveal text-4xl font-bold md:text-5xl">ทีมของเรา</h1>
      <p className="mt-3 text-muted-foreground">คนเบื้องหลังทุกคอร์สใน FRAMELESS.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {team.map((m, i) => (
          <article key={m.id} className="lift reveal overflow-hidden rounded-2xl border border-border bg-card" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="relative aspect-[4/3]" style={{ background: thumb(m.hue) }}>
              <CourseCover path={photos?.find((p) => p.id === m.id)?.photo_path ?? null} title={m.name} />
              <div className="absolute bottom-4 left-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-background/70 font-display text-2xl font-bold backdrop-blur">
                {m.name.slice(-1)}
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold">{m.name}</h2>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan">{m.role}</div>
              <p className="mt-4 text-sm text-muted-foreground">{m.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {m.skills.map((s) => <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs">{s}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
