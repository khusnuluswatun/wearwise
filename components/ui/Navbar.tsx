"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* shrink on scroll */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* entrance */
  useEffect(() => {
    gsap.from(navRef.current, { y: -60, opacity: 0, duration: 0.8, ease: "power3.out" });
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(10,10,10,0.92)"
            : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* logo */}
          <a
            href="/"
            className="font-display font-extrabold text-xl tracking-tight flex items-center gap-1.5"
          >
            WearWise
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(92,222,113,0.15)", color: "var(--color-accent)" }}
            >
              AI
            </span>
          </a>

          {/* desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Home",        href: "/" },
              { label: "How It Works",href: "#how-it-works" },
              { label: "Actions",     href: "#actions" },
              { label: "Scan",        href: "/scan" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* cta */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/scan"
              className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-black font-semibold text-sm px-5 py-2.5 rounded-full transition-all hover:opacity-90 hover:shadow-lg"
              style={{ boxShadow: "0 0 0 0 rgba(92,222,113,0)" }}
              onMouseEnter={(e) =>
                ((e.target as HTMLAnchorElement).style.boxShadow =
                  "0 0 20px rgba(92,222,113,0.4)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLAnchorElement).style.boxShadow =
                  "0 0 0 0 rgba(92,222,113,0)")
              }
            >
              Start Scanning
            </a>
          </div>

          {/* mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className="block w-6 h-px bg-white transition-all duration-300"
              style={{ transform: menuOpen ? "rotate(45deg) translateY(4px)" : "none" }}
            />
            <span
              className="block w-6 h-px bg-white transition-all duration-300"
              style={{ opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block w-6 h-px bg-white transition-all duration-300"
              style={{ transform: menuOpen ? "rotate(-45deg) translateY(-4px)" : "none" }}
            />
          </button>
        </div>
      </nav>

      {/* mobile drawer */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-300"
        style={{
          pointerEvents: menuOpen ? "auto" : "none",
          opacity: menuOpen ? 1 : 0,
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {[
            { label: "Home",         href: "/" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Actions",      href: "#actions" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-2xl font-display font-bold text-white hover:text-[var(--color-accent)] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/scan"
            onClick={() => setMenuOpen(false)}
            className="mt-4 bg-[var(--color-accent)] text-black font-semibold px-8 py-4 rounded-full text-lg"
          >
            Start Scanning 🌱
          </a>
        </div>
      </div>
    </>
  );
}