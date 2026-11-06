import { z } from "zod";

export const workSchema = z.object({
  title: z.string().trim().min(1, "กรุณาใส่ชื่อผลงาน").max(160),
  description: z.string().trim().max(2000),
  course_id: z.string().min(1, "กรุณาเลือกคอร์ส"),
});
export const reviewSchema = z.object({
  display_name: z.string().trim().min(1, "กรุณาใส่ชื่อที่แสดง").max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "กรุณาเขียนความคิดเห็น").max(2000),
});
export const feedbackSchema = z.object({
  status: z.enum(["reviewed", "revision"]),
  comment: z.string().trim().min(1, "กรุณาเขียนความคิดเห็น").max(2000),
});
export function workFileError(file: Pick<File, "type" | "size">): string | null {
  if (!["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(file.type)) return "รองรับ JPG, PNG, WebP, MP4 และ WebM";
  if (file.size > 100 * 1024 * 1024) return "ไฟล์ต้องไม่เกิน 100 MB";
  return null;
}
export function safeWorkUrl(raw: string): string | null {
  if (!raw.trim()) return null;
  const url = z.string().url().max(2000).parse(raw.trim());
  if (new URL(url).protocol !== "https:") throw new Error("กรุณาใช้ลิงก์ https://");
  return url;
}