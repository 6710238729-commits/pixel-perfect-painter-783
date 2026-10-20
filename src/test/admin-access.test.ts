import { describe, expect, it } from "vitest";
import { requireAdminRole } from "@/lib/admin-access";

describe("admin member access", () => {
  it("permits only a validated admin to read registered members and credits", () => {
    expect(() => requireAdminRole(true)).not.toThrow();
    expect(() => requireAdminRole(false)).toThrow();
    expect(() => requireAdminRole(null)).toThrow();
    expect(() => requireAdminRole(true, true)).toThrow();
  });
});