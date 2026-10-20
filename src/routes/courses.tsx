import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CourseCard } from "@/components/CourseCard";
import { categories } from "@/lib/data";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/catalog";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — FRAMELESS." },
      { name: "description", content: "รวมคอร์ส After Effects ทุกหมวด ค้นหา กรอง และเรียงลำดับได้" },
      { property: "og:title", content: "Courses — FRAMELESS." },
      { property: "og:description", content: "คอร์ส After Effects ตั้งแต่ Beginner ถึง Advanced" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: courses } = useSuspenseQuery(catalogQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [type, setType] = useState<"all" | "free" | "premium">("all");
  const [sort, setSort] = useState("default");

  const list = useMemo(() => {
    let l = courses.filter((c) =>
      (cat === "All" || c.category === cat) &&
      (type === "all" || (type === "premium") === c.premium) &&
      c.title.toLowerCase().includes(q.toLowerCase()));
    if (sort === "lessons") l = [...l].sort((a, b) => b.lessons.length - a.lessons.length);
    if (sort === "az") l = [...l].sort((a, b) => a.title.localeCompare(b.title));
    return l;
  }, [courses, q, cat, type, sort]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-32">
      <h1 className="reveal text-4xl font-bold md:text-5xl">Courses</h1>
      <p className="mt-3 text-muted-foreground">เลือกเส้นทางการเรียน After Effects ของคุณ</p>

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <label className="glass flex flex-1 items-center gap-2 rounded-full px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาคอร์ส..." className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
        </label>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="glass rounded-full px-4 py-2.5 outline-none">
          <option value="all">ทั้งหมด</option><option value="free">Free</option><option value="premium">Premium</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="glass rounded-full px-4 py-2.5 outline-none">
          <option value="default">แนะนำ</option><option value="lessons">บทเรียนมากสุด</option><option value="az">A–Z</option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["All", ...categories].map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((c) => <CourseCard key={c.id} c={c} />)}</div>
      ) : (
        <div className="glass mt-10 rounded-2xl p-16 text-center text-muted-foreground">ไม่พบคอร์สที่ตรงกับการค้นหา</div>
      )}
    </div>
  );
}
