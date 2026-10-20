import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "ตั้งรหัสผ่านใหม่ — FRAMELESS." },
      { name: "description", content: "ตั้งรหัสผ่านใหม่สำหรับบัญชี FRAMELESS." },
      { property: "og:title", content: "ตั้งรหัสผ่านใหม่ — FRAMELESS." },
      { property: "og:description", content: "ตั้งรหัสผ่านใหม่สำหรับบัญชี FRAMELESS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("เปลี่ยนรหัสผ่านแล้ว");
    nav({ to: "/wallet" });
  };
  return (
    <div className="mx-auto max-w-md px-5 pt-32">
      <h1 className="text-3xl font-bold">ตั้งรหัสผ่านใหม่</h1>
      <form onSubmit={save} className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-6">
        <input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="รหัสผ่านใหม่"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button className="bg-gradient-accent w-full rounded-xl py-3 text-sm font-medium text-primary-foreground">บันทึก</button>
      </form>
    </div>
  );
}
