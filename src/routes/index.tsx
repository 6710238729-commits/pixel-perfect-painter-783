import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { CourseCard } from "@/components/CourseCard";
import { thumb } from "@/lib/data";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRAMELESS. — เรียน After Effects ระดับมืออาชีพ" },
      { name: "description", content: "Learn the Motion. Create the Impossible. คอร์สเรียน Adobe After Effects ฟรีและ Premium" },
      { property: "og:title", content: "FRAMELESS. — After Effects Learning Platform" },
      { property: "og:description", content: "คอร์ส Motion Graphics, VFX และเทคนิคเจาะลึก After Effects" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Index,
});

const cats = [
  { name: "Beginner", hue: 255 }, { name: "Motion Graphics", hue: 290 },
  { name: "Visual Effects", hue: 200 }, { name: "Advanced Techniques", hue: 230 },
];

function Index() {
  const { data: courses } = useSuspenseQuery(catalogQuery);
  const free = courses.filter((c) => !c.premium);
  const premium = courses.filter((c) => c.premium);
  return (
    <>
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <img src={hero} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5">
          <div className="reveal max-w-2xl">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-cyan" /> Adobe After Effects Online Learning
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] md:text-7xl">
              Learn the Motion.<br /><span className="text-gradient">Create the Impossible.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              เรียน Motion Graphics และ VFX จากพื้นฐานถึงระดับสตูดิโอ พร้อมไฟล์โปรเจกต์ให้ลงมือทำจริง
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/courses" className="bg-gradient-accent shadow-glow inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-primary-foreground transition-transform hover:scale-105">
                Explore Courses <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/marketplace" className="glass inline-flex items-center rounded-full px-6 py-3 font-medium transition-colors hover:bg-secondary">
                Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section title="หมวดหมู่การเรียน" kicker="Categories">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats.map((c) => (
            <Link key={c.name} to="/courses" className="lift relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl border border-border p-5" style={{ background: thumb(c.hue) }}>
              <span className="font-display text-lg font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="คลิปสอนฟรี" kicker="Free Lessons">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{free.map((c) => <CourseCard key={c.id} c={c} />)}</div>
      </Section>

      <Section title="คอร์ส Premium" kicker="Premium">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{premium.map((c) => <CourseCard key={c.id} c={c} />)}</div>
      </Section>

      <Section title="ผลงานจากเทคนิคที่สอน" kicker="Showcase">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[205, 290, 240, 190, 265, 220].map((h, i) => (
            <div key={i} className={`lift rounded-2xl border border-border ${i === 0 ? "row-span-2" : "aspect-video"}`} style={{ background: thumb(h) }} />
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-24">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan">{kicker}</div>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}
