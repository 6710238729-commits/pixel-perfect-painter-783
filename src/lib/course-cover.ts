export const COURSE_COVER_BUCKET = "course-covers";

export function courseCoverError(file: Pick<File, "type" | "size">): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "เลือกรูป JPG, PNG หรือ WebP";
  if (file.size > 10 * 1024 * 1024) return "รูปต้องมีขนาดไม่เกิน 10 MB";
  return null;
}