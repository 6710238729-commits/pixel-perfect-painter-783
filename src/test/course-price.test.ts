import { describe, expect, it } from "vitest";
import { coursePriceLabel, parseCoursePrice } from "@/lib/course-price";

describe("Premium course prices", () => {
  it("saves the price entered by an admin as a whole baht amount", () => {
    expect(parseCoursePrice("250")).toBe(250);
    expect(parseCoursePrice("0")).toBe(0);
    expect(parseCoursePrice("-1")).toBeNull();
    expect(parseCoursePrice("1.5")).toBeNull();
    expect(parseCoursePrice("")).toBeNull();
  });
  it("uses one credit for each baht in the saved Premium price", () => {
    expect(coursePriceLabel({ premium: true, price: 250 })).toBe("250 บาท · 250 เครดิต");
  });
});