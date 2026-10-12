import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — FRAMELESS." },
      { name: "description", content: "สมัครสมาชิกหรือเข้าสู่ระบบ FRAMELESS." },
      { property: "og:title", content: "เข้าสู่ระบบ — FRAMELESS." },
      { property: "og:description", content: "สมัครสมาชิกหรือเข้าสู่ระบบ FRAMELESS." },
    ],
  }),
  component: AuthPage,
});

const input = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/wallet" });
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
        if (error) throw error;
        toast.success("สมัครสำเร็จ! กรุณายืนยันอีเมลที่ส่งไปให้");
        setMode("in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return toast.error("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
    if (r.redirected) return;
    nav({ to: "/wallet" });
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-32">
      <h1 className="text-3xl font-bold">{mode === "up" ? "สมัครสมาชิก" : mode === "forgot" ? "ลืมรหัสผ่าน" : "เข้าสู่ระบบ"}</h1>
      <form onSubmit={submit} className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-6">
        {mode === "up" && <input className={input} placeholder="ชื่อที่แสดง" value={name} onChange={(e) => setName(e.target.value)} required />}
        <input className={input} type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {mode !== "forgot" && <input className={input} type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />}
        <button disabled={busy} className="bg-gradient-accent w-full rounded-xl py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {mode === "up" ? "สมัครสมาชิก" : mode === "forgot" ? "ส่งลิงก์" : "เข้าสู่ระบบ"}
        </button>
        {mode !== "forgot" && (
          <button type="button" onClick={google} className="w-full rounded-xl border border-border py-3 text-sm hover:bg-secondary">ดำเนินการต่อด้วย Google</button>
        )}
        <div className="flex justify-between pt-2 text-xs text-muted-foreground">
          <button type="button" onClick={() => setMode(mode === "up" ? "in" : "up")} className="hover:text-foreground">
            {mode === "up" ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัคร"}
          </button>
          {mode === "in" && <button type="button" onClick={() => setMode("forgot")} className="hover:text-foreground">ลืมรหัสผ่าน?</button>}
        </div>
      </form>
    </div>
  );
}
