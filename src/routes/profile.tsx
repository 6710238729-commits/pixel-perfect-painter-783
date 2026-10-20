import { createFileRoute } from "@tanstack/react-router";
import { Award, BookOpen, Coins, Sparkles, User } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — FRAMELESS." },
      { name: "description", content: "คอลเลกชันการ์ด 3D ของคุณ — โปรไฟล์ สถิติการเรียน และความสำเร็จ" },
      { property: "og:title", content: "Profile — FRAMELESS." },
      { property: "og:description", content: "Interactive 3D card collection" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const cards: { title: string; icon: ReactNode; body: ReactNode }[] = [
  { title: "Profile", icon: <User />, body: <><Big>Motion Creator</Big><p>สมาชิก · Free Tier</p></> },
  { title: "Creator", icon: <Sparkles />, body: <><Big>Skills</Big><p>Text Animation · Shape Layers · Tracking</p></> },
  { title: "Learning", icon: <BookOpen />, body: <><Big>3 คอร์ส</Big><p>ความคืบหน้าเฉลี่ย 42%</p></> },
  { title: "Achievement", icon: <Award />, body: <><Big>5 เหรียญ</Big><p>First Render · Keyframe Master</p></> },
  { title: "Wallet", icon: <Coins />, body: <><Big>0 Credits</Big><p>ยังไม่มีธุรกรรม</p></> },
];

function Big({ children }: { children: ReactNode }) {
  return <div className="font-display text-2xl font-bold text-gradient">{children}</div>;
}

function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32">
      <h1 className="reveal text-4xl font-bold md:text-5xl">Your Collection</h1>
      <p className="mt-3 text-muted-foreground">เลื่อนเมาส์เพื่อเอียงการ์ด · คลิกหรือแตะเพื่อพลิก</p>
      <div className="mt-14 flex flex-wrap justify-center gap-8">
        {cards.map((c, i) => <Card3D key={c.title} {...c} index={i} />)}
      </div>
    </div>
  );
}

function Card3D({ title, icon, body, index }: { title: string; icon: ReactNode; body: ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    setTilt({ x: (0.5 - py) * 22, y: (px - 0.5) * 26 });
    ref.current.style.setProperty("--mx", `${px * 100}%`);
    ref.current.style.setProperty("--my", `${py * 100}%`);
    ref.current.style.setProperty("--shine", "1");
  };
  const leave = () => { setTilt({ x: 0, y: 0 }); ref.current?.style.setProperty("--shine", "0"); };

  return (
    <div className="card3d-scene reveal" style={{ animationDelay: `${index * 90}ms` }}>
      <div ref={ref} role="button" tabIndex={0} aria-label={`พลิกการ์ด ${title}`}
        onPointerMove={move} onPointerLeave={leave} onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setFlipped((f) => !f))}
        className="card3d h-[340px] w-[230px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[1.25rem]"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)` }}>
        <div className="card3d-face card3d-back-pattern flex items-center justify-center shadow-glow">
          <div className="absolute inset-3 rounded-2xl border border-border" />
          <div className="font-display text-xl font-bold tracking-tight">F<span className="text-cyan">.</span></div>
          <div className="absolute bottom-5 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{title}</div>
          <div className="card3d-shine" />
        </div>
        <div className="card3d-face card3d-front flex flex-col bg-card p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-accent text-primary-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
          <div className="mt-3 text-xs uppercase tracking-[0.3em] text-cyan">{title} Card</div>
          <div className="mt-auto space-y-2 text-sm text-muted-foreground">{body}</div>
          <div className="card3d-shine" />
        </div>
      </div>
    </div>
  );
}
