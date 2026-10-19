import { describe, expect, it } from "vitest";
import { courseCoverError } from "@/lib/course-cover";

describe("course cover uploads", () => {
  it("accepts supported images up to the bucket's 10 MB limit", () => {
    expect(courseCoverError({ type: "image/png", size: 10 * 1024 * 1024 })).toBeNull();
    expect(courseCoverError({ type: "image/png", size: 10 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("rejects non-image and executable SVG uploads", () => {
    expect(courseCoverError({ type: "image/svg+xml", size: 100 })).not.toBeNull();
    expect(courseCoverError({ type: "video/mp4", size: 100 })).not.toBeNull();
    expect(courseCoverError({ type: "image/jpeg", size: 100 })).toBeNull();
    expect(courseCoverError({ type: "image/webp", size: 100 })).toBeNull();
  });
});