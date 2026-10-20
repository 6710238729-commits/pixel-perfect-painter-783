import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminMembers } from "@/components/AdminMembers";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "แอดมิน — FRAMELESS." },
      { name: "description", content: "ตรวจสอบและอนุมัติการเติมเครดิต" },
      { property: "og:title", content: "แอดมิน — FRAMELESS." },
      { property: "og:description", content: "ตรวจสอบและอนุมัติการเติมเครดิต" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-topups"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { isAdmin: false, rows: [] };
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (!isAdmin) return { isAdmin: false, rows: [] };
      const { data: rows } = await supabase.from("topup_requests").select("*").eq("status", "pending").order("created_at");
      return { isAdmin: true, rows: rows ?? [] };
    },
  });

  if (isLoading) return <div className="pt-32 text-center text-muted-foreground">กำลังโหลด…</div>;
  if (!data?.isAdmin) return <div className="pt-32 text-center text-muted-foreground">หน้านี้สำหรับแอดมินเท่านั้น</div>;

  return (
    <div className="mx-auto max-w-4xl px-5 pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-bold">รายการรออนุมัติ</h1>
        <Button variant="outline" asChild><Link to="/admin/content">จัดการคอร์สและรูปทีม</Link></Button>
      </div>
      <div className="mt-8 space-y-4">
        {data.rows.length === 0 && <div className="text-muted-foreground">ไม่มีรายการค้าง</div>}
        {data.rows.map((r) => <Row key={r.id} r={r} done={() => qc.invalidateQueries({ queryKey: ["admin-topups"] })} />)}
      </div>
      <AdminMembers />
    </div>
  );
}

type R = { id: string; method: string; amount: number; slip_path: string | null; voucher_url: string | null; created_at: string; user_id: string };

function Row({ r, done }: { r: R; done: () => void }) {
  const [amt, setAmt] = useState(String(r.amount || ""));
  const view = async () => {
    if (!r.slip_path) return;
    const { data } = await supabase.storage.from("slips").createSignedUrl(r.slip_path, 300);
    if (data) window.open(data.signedUrl, "_blank");
  };
  const act = async (approve: boolean) => {
    const args = approve ? { _id: r.id, _approve: true, _amount: Number(amt) } : { _id: r.id, _approve: false };
    const { error } = await supabase.rpc("review_topup", args);
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"); done();
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5 text-sm">
      <div className="flex-1">
        <div className="font-semibold">{r.method === "slip" ? "โอนเงิน" : "ซองอั่งเปา"}</div>
        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("th-TH")}</div>
        {r.voucher_url && <a href={r.voucher_url} target="_blank" rel="noreferrer" className="text-xs text-cyan underline">เปิดซอง</a>}
        {r.slip_path && <button onClick={view} className="text-xs text-cyan underline">ดูสลิป</button>}
      </div>
      <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="เครดิต" className="w-24 rounded-lg border border-border bg-background px-3 py-2" />
      <button onClick={() => act(true)} disabled={!Number(amt)} className="bg-gradient-accent rounded-full px-4 py-2 text-primary-foreground disabled:opacity-50">อนุมัติ</button>
      <button onClick={() => act(false)} className="rounded-full border border-border px-4 py-2">ปฏิเสธ</button>
    </div>
  );
}
