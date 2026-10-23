import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/catalog";
import { PurchaseButton, usePurchaseState } from "@/components/PurchaseButton";
import { CourseCard } from "@/components/CourseCard";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — FRAMELESS." },
      { name: "description", content: "ซื้อคลิปสอนเทคนิค After Effects เจาะลึกด้วยเครดิต" },
      { property: "og:title", content: "Marketplace — FRAMELESS." },
      { property: "og:description", content: "วิดีโอสอนเทคนิค After Effects ระดับ Premium" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Marketplace,
});

function Marketplace() {
  const { data: courses } = useSuspenseQuery(catalogQuery);
  const { data: account } = usePurchaseState();
  const premium = courses.filter((c) => c.premium);
  return <div className="mx-auto max-w-7xl px-5 pt-32 pb-16">
    <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="text-4xl font-bold md:text-5xl">Marketplace</h1>{account && <span className="font-semibold text-cyan">{account.balance.toLocaleString("th-TH")} เครดิต</span>}</div>
    <p className="mt-3 text-muted-foreground">คอร์ส Premium</p>
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{premium.map((c) => <article key={c.id} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"><CourseCard c={c} /><div className="mt-auto p-5"><PurchaseButton courseId={c.id} title={c.title} price={c.price ?? 0} /></div></article>)}</div>
    {!premium.length && <p className="mt-10 text-muted-foreground">ยังไม่มีคอร์ส Premium</p>}
  </div>;
}
