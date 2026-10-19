export type Level = "Beginner" | "Intermediate" | "Advanced";
export interface Lesson { id: string; title: string; duration: string; free?: boolean }
export interface Course {
  id: string; title: string; category: string; level: Level; duration: string;
  premium: boolean; hue: number; description: string; lessons: Lesson[]; cover_path?: string | null;
}

const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
export const sampleVideo = SAMPLE_VIDEO;

export const categories = [
  "After Effects Beginner", "Text Animation", "Motion Graphics", "3D Camera & Tracking",
  "VFX & Compositing", "Velocity Edit", "Transition & Effects", "Advanced Editing", "Project-Based Learning",
];

const mk = (n: number, prefix: string): Lesson[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i + 1}`, title: `บทที่ ${i + 1}`, duration: `${8 + ((i * 7) % 14)}:${String((i * 13) % 60).padStart(2, "0")}`, free: i === 0 }));

export const courses: Course[] = [
  { id: "ae-start", title: "After Effects 101", category: "After Effects Beginner", level: "Beginner", duration: "2h 10m", premium: false, hue: 255, description: "เริ่มต้นจากศูนย์ — Interface, Composition, Keyframe และ Graph Editor", lessons: mk(8, "ae-start") },
  { id: "kinetic-type", title: "Kinetic Typography", category: "Text Animation", level: "Intermediate", duration: "3h 05m", premium: true, hue: 205, description: "สร้างตัวอักษรเคลื่อนไหวแบบ Cinematic ด้วย Text Animator และ Expression", lessons: mk(10, "kinetic") },
  { id: "shape-flow", title: "Shape Layer Flow", category: "Motion Graphics", level: "Beginner", duration: "1h 40m", premium: false, hue: 290, description: "Motion Graphics ด้วย Shape Layer, Trim Paths และ Repeater", lessons: mk(6, "shape") },
  { id: "camera-track", title: "3D Camera Tracking", category: "3D Camera & Tracking", level: "Advanced", duration: "4h 20m", premium: true, hue: 230, description: "ติดตามกล้องและวางวัตถุลงในฉากจริงอย่างแนบเนียน", lessons: mk(12, "cam") },
  { id: "vfx-comp", title: "VFX Compositing Essentials", category: "VFX & Compositing", level: "Advanced", duration: "5h 00m", premium: true, hue: 190, description: "Keying, Roto, Color Match และการผสานภาพระดับโปร", lessons: mk(14, "vfx") },
  { id: "velocity", title: "Velocity Edit Mastery", category: "Velocity Edit", level: "Intermediate", duration: "1h 55m", premium: false, hue: 270, description: "Time Remap, Motion Blur และจังหวะเพลงแบบไวรัล", lessons: mk(7, "vel") },
  { id: "transitions", title: "Seamless Transitions", category: "Transition & Effects", level: "Intermediate", duration: "2h 30m", premium: true, hue: 215, description: "ทรานซิชันแบบไร้รอยต่อที่ใช้ได้กับทุกโปรเจกต์", lessons: mk(9, "tr") },
  { id: "project-promo", title: "Product Promo Project", category: "Project-Based Learning", level: "Advanced", duration: "3h 45m", premium: true, hue: 300, description: "ทำวิดีโอโปรโมทสินค้าตั้งแต่ Storyboard จนถึง Render", lessons: mk(11, "promo") },
];

export const products = [
  { id: "p1", title: "Cinematic Text Animation", credits: 80, duration: "45m", hue: 205, desc: "เทคนิคข้อความแบบภาพยนตร์", gets: ["Project file", "5 presets"] },
  { id: "p2", title: "Advanced Motion Blur", credits: 120, duration: "1h 10m", hue: 255, desc: "Motion Blur ที่สมจริงทุกเฟรม", gets: ["Project file", "Cheat sheet"] },
  { id: "p3", title: "3D Camera Tracking Masterclass", credits: 250, duration: "2h 30m", hue: 230, desc: "เจาะลึก Camera Solve แบบมืออาชีพ", gets: ["Footage pack", "Project file"] },
  { id: "p4", title: "Professional Transition Pack", credits: 180, duration: "1h 25m", hue: 290, desc: "20 ทรานซิชันพร้อมวิธีสร้าง", gets: ["20 presets", "Sound FX"] },
  { id: "p5", title: "Advanced VFX Compositing", credits: 350, duration: "3h 15m", hue: 190, desc: "Compositing ระดับสตูดิโอ", gets: ["Plates", "Project files"] },
  { id: "p6", title: "Complete Motion Graphics Workflow", credits: 500, duration: "6h 00m", hue: 270, desc: "เวิร์กโฟลว์ครบวงจรตั้งแต่ไอเดียถึงส่งงาน", gets: ["All assets", "Templates", "Certificate"] },
];

export const thumb = (hue: number) =>
  `radial-gradient(circle at 30% 30%, oklch(0.7 0.2 ${hue} / .9), transparent 55%), radial-gradient(circle at 80% 80%, oklch(0.55 0.22 ${hue + 40} / .8), transparent 50%), oklch(0.16 0.04 ${hue})`;
