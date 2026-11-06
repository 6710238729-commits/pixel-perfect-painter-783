import { createFileRoute, Link } from "@tanstack/react-router";
import { communityQuery } from "@/lib/community.functions";
import { ExampleGallery } from "@/components/ExampleGallery";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/showcase")({
  head: () => ({ meta: [{ title: "Showcase — ผลงานจากคอร์ส FRAMELESS." }, { name: "description", content: "ผลงานตัวอย่างจากคอร์ส Adobe After Effects ของ FRAMELESS." }, { property: "og:title", content: "Showcase — FRAMELESS." }, { property: "og:description", content: "ชมผลงานจากเทคนิคที่สอนในคอร์ส" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(communityQuery),
  component: () => <main className="mx-auto max-w-7xl px-5 pt-40"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-cyan">ผลงานจากเทคนิคที่สอน</p><h1 className="mt-2 text-4xl font-bold">Showcase</h1></div><Button asChild variant="outline"><Link to="/assignments">ส่งผลงานของฉัน</Link></Button></div><ExampleGallery /></main>,
});