import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Coins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { products, thumb } from "@/lib/data";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  component: Marketplace,
});

type P = (typeof products)[number];

function Marketplace() {
  const [pending, setPending] = useState<P | null>(null);
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32">
      <h1 className="reveal text-4xl font-bold md:text-5xl">Marketplace</h1>
      <p className="mt-3 text-muted-foreground">เทคนิคเจาะลึกแบบ Premium — ซื้อครั้งเดียว ดูได้ตลอด</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article key={p.id} className="lift flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-video" style={{ background: thumb(p.hue) }} />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{p.duration}</li>
                {p.gets.map((g) => <li key={g} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan" />{g}</li>)}
              </ul>
              <div className="mt-auto flex items-center justify-between pt-6">
                <span className="flex items-center gap-1.5 font-display text-lg font-bold"><Coins className="h-4 w-4 text-cyan" />{p.credits}</span>
                <button onClick={() => setPending(p)} className="bg-gradient-accent rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105">Buy with Credits</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการใช้ {pending?.credits} เครดิต?</AlertDialogTitle>
            <AlertDialogDescription>"{pending?.title}" — ระบบสมาชิกและกระเป๋าเครดิตจะเปิดใช้งานในขั้นตอนถัดไป</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast("ต้องเข้าสู่ระบบก่อนซื้อ — ระบบสมาชิกกำลังจะมาเร็ว ๆ นี้")}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
