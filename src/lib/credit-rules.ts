import { z } from "zod";

export const balanceInput = z.object({ userId: z.string().uuid(), balance: z.number().int().min(0).max(2147483647), note: z.string().trim().min(1).max(300) });
export const purchaseInput = z.object({ courseId: z.string().min(1).max(150), expectedPrice: z.number().int().min(0).max(2147483647) });
export function purchaseError(message: string): string {
  if (message.includes("Insufficient credits")) return "เครดิตไม่เพียงพอ กรุณาเติมเครดิต";
  if (message.includes("Price changed")) return "ราคาคอร์สเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่ก่อนซื้อ";
  return "ซื้อไม่สำเร็จ กรุณาลองใหม่";
}