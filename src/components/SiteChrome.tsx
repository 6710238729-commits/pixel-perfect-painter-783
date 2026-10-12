import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/profile", label: "Profile" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "glass py-3" : "py-5"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          FRAMELESS<span className="text-cyan">.</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <div className="font-display text-xl font-bold">FRAMELESS<span className="text-cyan">.</span></div>
          <p className="mt-2 text-sm text-muted-foreground">Learn the Motion. Create the Impossible.</p>
        </div>
        <div className="text-sm text-muted-foreground">แพลตฟอร์มเรียน Adobe After Effects ออนไลน์ ตั้งแต่พื้นฐานจนถึงระดับสตูดิโอ</div>
        <div className="text-sm text-muted-foreground md:text-right">hello@frameless.studio<br />© 2026 FRAMELESS.</div>
      </div>
    </footer>
  );
}
