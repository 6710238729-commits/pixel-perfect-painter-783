import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const hashFrom = (link: string) => {
  const m = link.match(/[?&]v=([A-Za-z0-9]+)/) ?? link.match(/^([A-Za-z0-9]{10,})$/);
  return m?.[1] ?? null;
};

// Redeems a TrueMoney angpao link into the owner's wallet; 1 baht = 1 credit.
export const redeemAngpao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ link: z.string().trim().min(5).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const hash = hashFrom(data.link);
    if (!hash) return { ok: false as const, message: "ลิงก์ซองอั่งเปาไม่ถูกต้อง" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const voucherUrl = `https://gift.truemoney.com/campaign/?v=${hash}`;

    const { data: dup } = await supabaseAdmin.from("topup_requests").select("id").eq("voucher_url", voucherUrl).maybeSingle();
    if (dup) return { ok: false as const, message: "ลิงก์นี้ถูกใช้ไปแล้ว" };

    const phone = process.env["TRUEMONEY_PHONE"];
    let amount = 0;
    let redeemed = false;
    if (phone) {
      try {
        const res = await fetch(`https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
          body: JSON.stringify({ mobile: phone, voucher_hash: hash }),
        });
        const json = (await res.json().catch(() => null)) as
          | { status?: { code?: string }; data?: { my_ticket?: { amount_baht?: string } } }
          | null;
        if (json?.status?.code === "SUCCESS") {
          amount = Math.floor(Number(json.data?.my_ticket?.amount_baht ?? 0));
          redeemed = amount > 0;
        } else if (json?.status?.code) {
          const map: Record<string, string> = {
            VOUCHER_OUT_OF_STOCK: "ซองนี้ถูกรับไปหมดแล้ว",
            VOUCHER_NOT_FOUND: "ไม่พบซองนี้",
            VOUCHER_EXPIRED: "ซองหมดอายุแล้ว",
            CANNOT_GET_OWN_VOUCHER: "ไม่สามารถรับซองของตัวเองได้",
          };
          if (map[json.status.code]) return { ok: false as const, message: map[json.status.code] };
        }
      } catch (e) {
        console.error("angpao redeem failed", e);
      }
    }

    if (redeemed) {
      await supabaseAdmin.from("topup_requests").insert({ user_id: context.userId, method: "angpao", amount, voucher_url: voucherUrl, status: "approved", reviewed_at: new Date().toISOString(), note: "auto" });
      const { data: w } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", context.userId).single();
      await supabaseAdmin.from("wallets").update({ balance: (w?.balance ?? 0) + amount, updated_at: new Date().toISOString() }).eq("user_id", context.userId);
      return { ok: true as const, auto: true, amount };
    }
    await supabaseAdmin.from("topup_requests").insert({ user_id: context.userId, method: "angpao", voucher_url: voucherUrl, status: "pending" });
    return { ok: true as const, auto: false, amount: 0 };
  });
