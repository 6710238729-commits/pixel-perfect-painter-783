import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Gift, Landmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { redeemAngpao } from "@/lib/topup.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "กระเป๋าเครดิต — FRAMELESS." },
      { name: "description", content: "เติมเครดิตด้วยการโอนเงินหรือซองอั่งเปา TrueMoney" },
      { property: "og:title", content: "กระเป๋าเครดิต — FRAMELESS." },
      { property: "og:description", content: "เติมเครดิตด้วยการโอนเงินหรือซองอั่งเปา TrueMoney" },
    ],
  }),
  component: Wallet,
});

// Bank details for slip top-ups.
const BANK = { bank: "ธนาคารกสิกรไทย", name: "ธนภัทร มณีแสงสาคร", number: "164-1-70655-4" };
const input = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const statusTh = { pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", rejected: "ถูกปฏิเสธ" } as Record<string, string>;

function Wallet() {
  const qc = useQueryClient();
  const redeem = useServerFn(redeemAngpao);
  const [tab, setTab] = useState<"slip" | "angpao">("slip");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const [w, t, a] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", uid).maybeSingle(),
        supabase.from("topup_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      ]);
      return { uid, balance: w.data?.balance ?? 0, history: t.data ?? [], isAdmin: !!a.data };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["wallet"] });

  const sendSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !data) return;
    setBusy(true);
    try {
      const path = `${data.uid}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const up = await supabase.storage.from("slips").upload(path, file);
      if (up.error) throw up.error;
      const { error } = await supabase.from("topup_requests").insert({ user_id: data.uid, method: "slip", amount: Number(amount), slip_path: path });
      if (error) throw error;
      toast.success("ส่งสลิปแล้ว รอแอดมินตรวจสอบ");
      setAmount(""); setFile(null); refresh();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  const sendAngpao = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await redeem({ data: { link } });
      if (!r.ok) toast.error(r.message);
      else if (r.auto) toast.success(`รับซองสำเร็จ +${r.amount} เครดิต`);
      else toast.success("ส่งซองแล้ว รอแอดมินตรวจสอบ");
      setLink(""); refresh();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-bold">กระเป๋าเครดิต</h1>
        {data?.isAdmin && <a href="/admin" className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">หน้าแอดมิน</a>}
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-glow">
        <div className="text-sm text-muted-foreground">ยอดคงเหลือ</div>
        <div className="mt-2 flex items-center gap-3 font-display text-5xl font-bold text-gradient"><Coins className="h-9 w-9 text-cyan" />{data?.balance ?? "…"}</div>
        <div className="mt-2 text-xs text-muted-foreground">1 บาท = 1 เครดิต</div>
      </div>

      <div className="mt-8 flex gap-2">
        <button onClick={() => setTab("slip")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${tab === "slip" ? "bg-secondary" : "text-muted-foreground"}`}><Landmark className="h-4 w-4" />โอนเงิน + แนบสลิป</button>
        <button onClick={() => setTab("angpao")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${tab === "angpao" ? "bg-secondary" : "text-muted-foreground"}`}><Gift className="h-4 w-4" />ซองอั่งเปา TrueMoney</button>
      </div>

      {tab === "slip" ? (
        <form onSubmit={sendSlip} className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-6">
          <div className="rounded-xl bg-secondary p-4 text-sm">
            <div>{BANK.bank}</div><div>{BANK.name}</div><div className="font-display text-lg">{BANK.number}</div>
          </div>
          <input className={input} type="number" min={1} placeholder="จำนวนเงินที่โอน (บาท)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <input className={input} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          <button disabled={busy} className="bg-gradient-accent w-full rounded-xl py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">ส่งสลิป</button>
        </form>
      ) : (
        <form onSubmit={sendAngpao} className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">สร้างซองอั่งเปาในแอป TrueMoney (แบบแบ่งเงินเท่ากัน 1 คน) แล้ววางลิงก์ที่นี่</p>
          <input className={input} placeholder="https://gift.truemoney.com/campaign/?v=..." value={link} onChange={(e) => setLink(e.target.value)} required />
          <button disabled={busy} className="bg-gradient-accent w-full rounded-xl py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">รับซอง</button>
        </form>
      )}

      <h2 className="mt-12 text-xl font-semibold">ประวัติการเติม</h2>
      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {data?.history.length ? data.history.map((h) => (
          <div key={h.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div>{h.method === "slip" ? "โอนเงิน" : "ซองอั่งเปา"}</div>
              <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("th-TH")}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{h.amount ? `+${h.amount}` : "-"}</div>
              <div className="text-xs text-muted-foreground">{statusTh[h.status]}</div>
            </div>
          </div>
        )) : <div className="p-6 text-sm text-muted-foreground">ยังไม่มีรายการ</div>}
      </div>
    </div>
  );
}
