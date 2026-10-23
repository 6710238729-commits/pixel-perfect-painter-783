import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { buyCourse, fetchPurchases } from "@/lib/purchases.functions";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

export function usePurchaseState() {
  const { user, ready } = useSession();
  const fetch = useServerFn(fetchPurchases);
  const query = useQuery({ queryKey: ["purchases", user?.id], queryFn: () => fetch(), enabled: ready && Boolean(user) });
  return { ...query, user, ready };
}

export function PurchaseButton({ courseId, title, price }: { courseId: string; title: string; price: number }) {
  const { user, ready, data, isLoading, error } = usePurchaseState();
  const buy = useServerFn(buyCourse);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ready) return <Button disabled>กำลังโหลด…</Button>;
  if (!user) return <Button asChild><Link to="/auth">เข้าสู่ระบบเพื่อซื้อ</Link></Button>;
  if (data?.purchases.some((p) => p.course_id === courseId)) return <Button asChild variant="outline"><Link to="/learn/$courseId" params={{ courseId }}>เรียนคอร์สที่ซื้อแล้ว</Link></Button>;
  const confirm = async () => {
    setBusy(true);
    try { await buy({ data: { courseId, expectedPrice: price } }); await Promise.all([qc.invalidateQueries({ queryKey: ["purchases"] }), qc.invalidateQueries({ queryKey: ["wallet"] }), qc.invalidateQueries({ queryKey: ["admin-members"] })]); setOpen(false); toast.success("ซื้อสำเร็จ เข้าเรียนได้แล้ว"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "ซื้อไม่สำเร็จ"); }
    finally { setBusy(false); }
  };
  return <><Button disabled={isLoading || Boolean(error)} onClick={() => setOpen(true)}><ShoppingCart />ซื้อ {price.toLocaleString("th-TH")} เครดิต</Button>
    {error && <p role="alert" className="text-sm text-destructive">โหลดเครดิตไม่สำเร็จ</p>}
    <AlertDialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>ยืนยันซื้อ {title}</AlertDialogTitle><AlertDialogDescription>ราคา {price} เครดิต · ยอดคงเหลือ {data?.balance ?? 0} เครดิต</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>ยกเลิก</AlertDialogCancel>{(data?.balance ?? 0) < price ? <Button asChild><Link to="/wallet">เติมเครดิต</Link></Button> : <Button disabled={busy} onClick={() => void confirm()}>{busy ? "กำลังซื้อ…" : "ยืนยันซื้อ"}</Button>}</AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}