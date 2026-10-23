import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { balanceInput, purchaseInput } from "@/lib/credit-rules";
const userId = "c14e1ccc-aac3-4e11-97e0-ee60fc7fc6f4";
const sql = readFileSync("drizzle/migrations/0005_credit_purchases_and_secure_playback.sql", "utf8");
describe("member credits and purchases", () => {
  it("allows an admin to set zero credits", () => expect(balanceInput.parse({ userId, balance: 0, note: "แก้ไขยอด" }).balance).toBe(0));
  it("rejects negative credits", () => expect(balanceInput.safeParse({ userId, balance: -1, note: "แก้ไข" }).success).toBe(false));
  it("rejects fractional credits", () => expect(balanceInput.safeParse({ userId, balance: 1.5, note: "แก้ไข" }).success).toBe(false));
  it("requires an adjustment reason", () => expect(balanceInput.safeParse({ userId, balance: 10, note: " " }).success).toBe(false));
  it("accepts a confirmed course price of 80 credits", () => expect(purchaseInput.parse({ courseId: "kinetic-type", expectedPrice: 80 }).expectedPrice).toBe(80));
  it("serializes purchases on the member wallet", () => expect(sql).toMatch(/balance INTO w[\s\S]*FOR UPDATE/));
  it("prevents a second charge for the same course", () => expect(sql).toMatch(/IF FOUND THEN RETURN jsonb_build_object\('owned',true/));
  it("rejects insufficient credits before deducting", () => expect(sql.indexOf("IF w<cost")).toBeLessThan(sql.indexOf("balance=balance-cost")));
  it("protects admin balance changes in the database", () => expect(sql).toContain("IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'"));
  it("does not grant premium URLs to public lesson readers", () => expect(sql).toContain("REVOKE SELECT ON public.lessons FROM anon,authenticated"));
});