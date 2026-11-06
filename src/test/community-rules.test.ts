import { describe, expect, it } from "vitest";
import { reviewSchema, safeWorkUrl, workFileError, feedbackSchema } from "@/lib/community-rules";

describe("community validation", () => {
  it("accepts 1 through 5 stars but rejects ratings outside that range", () => {
    for (const rating of [1, 5]) expect(reviewSchema.safeParse({ display_name: "ผู้เรียน", rating, comment: "ดีมาก" }).success).toBe(true);
    for (const rating of [0, 6, 1.5]) expect(reviewSchema.safeParse({ display_name: "ผู้เรียน", rating, comment: "ดีมาก" }).success).toBe(false);
  });
  it("only accepts secure work links", () => {
    expect(safeWorkUrl("https://example.com/work")).toBe("https://example.com/work");
    expect(() => safeWorkUrl("javascript:alert(1)")).toThrow();
    expect(() => safeWorkUrl("http://example.com")).toThrow();
  });
  it("caps supported work files at 100 MB", () => {
    expect(workFileError({ type: "video/mp4", size: 100 * 1024 * 1024 })).toBeNull();
    expect(workFileError({ type: "video/mp4", size: 100 * 1024 * 1024 + 1 })).not.toBeNull();
    expect(workFileError({ type: "text/html", size: 1 })).not.toBeNull();
  });
  it("requires feedback for either review outcome", () => {
    expect(feedbackSchema.safeParse({ status: "reviewed", comment: " " }).success).toBe(false);
    expect(feedbackSchema.safeParse({ status: "revision", comment: "ปรับจังหวะ" }).success).toBe(true);
  });
});