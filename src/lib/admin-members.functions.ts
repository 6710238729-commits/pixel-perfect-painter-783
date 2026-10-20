import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminRole } from "@/lib/admin-access";

export const fetchAdminMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    requireAdminRole(isAdmin, Boolean(roleError));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users = [];
    for (let page = 1; ; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("โหลดรายชื่อสมาชิกไม่สำเร็จ");
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const [{ data: profiles, error: profileError }, { data: wallets, error: walletError }] = await Promise.all([
      context.supabase.from("profiles").select("id, display_name"),
      context.supabase.from("wallets").select("user_id, balance"),
    ]);
    if (profileError || walletError) throw new Error("โหลดข้อมูลสมาชิกไม่สำเร็จ");
    return users.map((user) => ({
      id: user.id, email: user.email ?? "—", createdAt: user.created_at,
      name: profiles?.find((p) => p.id === user.id)?.display_name ?? "—",
      balance: wallets?.find((w) => w.user_id === user.id)?.balance ?? 0,
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });