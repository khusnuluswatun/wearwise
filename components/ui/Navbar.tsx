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
    gsap.fromTo(
      navRef.current,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(255,255,255,0.92)"
            : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "none",
          boxShadow: scrolled ? "0 4px 24px rgba(15,23,42,0.07)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* logo */}
          <a
            href="/"
            className="font-display font-extrabold text-xl tracking-tight flex items-center gap-1.5 text-[#0f172a]"
          >
            WearWise
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}
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
              { label: "Partner",     href: "/login" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm ${link.label === "Partner" ? "text-blue-500 font-bold" : "text-slate-500"} hover:text-[#22c55e] transition-colors duration-200 font-medium`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* cta */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2">
              Login
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 bg-[#22c55e] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all hover:opacity-90 hover:shadow-lg shadow-green-500/20"
            >
              Get Started
            </a>
          </div>

          {/* mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className="block w-6 h-px bg-slate-700 transition-all duration-300"
              style={{ transform: menuOpen ? "rotate(45deg) translateY(4px)" : "none" }}
            />
            <span
              className="block w-6 h-px bg-slate-700 transition-all duration-300"
              style={{ opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block w-6 h-px bg-slate-700 transition-all duration-300"
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
          background: "rgba(255,255,255,0.97)",
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
              className="text-2xl font-display font-bold text-[#0f172a] hover:text-[#22c55e] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="mt-4 bg-[#22c55e] text-white font-semibold px-8 py-4 rounded-full text-lg shadow-lg shadow-green-500/20"
          >
            Get Started 🌱
          </a>
          <a
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="text-lg font-bold text-slate-500 hover:text-slate-900"
          >
            Login
          </a>
        </div>
      </div>
    </>
  );
}