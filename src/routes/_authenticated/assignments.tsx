import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { catalogQuery } from "@/lib/catalog";
import { fetchSubmissions } from "@/lib/community.functions";
import { WorkForm } from "@/components/WorkForm";
import { SubmissionList } from "@/components/SubmissionList";
import { usePurchaseState } from "@/components/PurchaseButton";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({ meta: [{ title: "My Works — ส่งผลงาน FRAMELESS." }, { name: "description", content: "ส่งผลงานจากคอร์สและดูความคิดเห็นจากแอดมิน" }, { property: "og:title", content: "My Works — FRAMELESS." }, { property: "og:description", content: "ผลงานและผลตรวจของผู้เรียน" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery), component: Assignments,
});
function Assignments() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { data: account, user } = usePurchaseState();
  const fetch = useServerFn(fetchSubmissions);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["submissions", user?.id], enabled: Boolean(user), queryFn: () => fetch() });
  const courses = catalog.filter((c) => !c.premium || account?.isAdmin || account?.purchases.some((p) => p.course_id === c.id));
  const done = async () => { await qc.invalidateQueries({ queryKey: ["submissions"] }); };
  return <main className="mx-auto max-w-5xl px-5 pt-40"><p className="text-sm text-cyan">ผลงานของฉัน</p><h1 className="mt-2 text-4xl font-bold">My Works</h1><section className="my-8 border-y border-border py-8"><h2 className="mb-5 text-xl font-semibold">ส่งผลงานให้แอดมินตรวจ</h2>{user && <WorkForm userId={user.id} courses={courses} done={done} />}</section><h2 className="mb-6 text-2xl font-semibold">งานที่ส่งและผลตรวจ</h2>{isLoading ? <p>กำลังโหลด…</p> : error ? <p role="alert" className="text-destructive">โหลดงานไม่สำเร็จ</p> : user && <SubmissionList rows={(data?.rows ?? []).filter((r) => r.user_id === user.id)} userId={user.id} done={done} />}</main>;
}