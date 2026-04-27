"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/ui/Navbar";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────
   CATEGORY DATA
───────────────────────────────────────── */
const CATEGORIES = [
  {
    id: "sell",
    label: "Sell",
    tagline: "Turn Your Closet Into Cash",
    description: "List your pre-loved clothes on WearWise Market and let buyers find them. Earn money while giving your garments a second owner.",
    color: "#FF8C42",
    pill: "For Sellers",
    emoji: "🏷️",
    garmentEmoji: "👕",
    steps: [
      { icon: "📸", title: "Scan & Describe", desc: "AI scans your garment and auto-generates a listing description." },
      { icon: "🛍️", title: "List on Market",  desc: "Your item goes live on the WearWise marketplace instantly." },
      { icon: "💬", title: "Buyer Connects",  desc: "Buyers click 'Contact Seller' — deal happens outside platform." },
      { icon: "✅", title: "Confirm & Earn",  desc: "Confirm sale within 3 days, earn reward points. 🎉" },
    ],
  },
  {
    id: "donate",
    label: "Donate",
    tagline: "Give More Than Just Clothes",
    description: "Connect with verified donation centers near you. Your pre-loved clothes reach people who truly need them — tracked from your hands to theirs.",
    color: "#4DAAFF",
    pill: "For Good",
    emoji: "🤝",
    garmentEmoji: "👗",
    steps: [
      { icon: "📸", title: "Scan & Describe", desc: "Document your item with a photo and short description." },
      { icon: "📍", title: "Find Centers",    desc: "See verified donation centers on a map sorted by distance." },
      { icon: "💬", title: "Chat & Schedule", desc: "Chat with the center, choose pick-up or delivery + date." },
      { icon: "🌟", title: "Confirm & Glow",  desc: "Both sides confirm — you get a reward and a warm feeling." },
    ],
  },
  {
    id: "upcycle",
    label: "Upcycle",
    tagline: "Old Clothes, New Stories",
    description: "Let AI dream up transformation ideas for your garment, then connect with local UMKM artisans who can make it happen.",
    color: "#B06AFF",
    pill: "Creative",
    emoji: "✂️",
    garmentEmoji: "🧥",
    steps: [
      { icon: "🤖", title: "AI Dream Generator", desc: "Our AI generates upcycling ideas for your exact garment using GPT." },
      { icon: "🏪", title: "Find Local UMKM",    desc: "Browse verified artisan workshops near you." },
      { icon: "💬", title: "Chat & Agree",        desc: "Set price, timeline, and pick-up or delivery method." },
      { icon: "🎨", title: "Track & Complete",    desc: "Both sides confirm completion. Rewards + a new creation!" },
    ],
  },
  {
    id: "recycle",
    label: "Recycle",
    tagline: "Zero Waste, Real Impact",
    description: "When clothes can't be reused, they can still save the planet. Connect with certified recycling centers and turn fabric waste into raw materials.",
    color: "#2DCB73",
    pill: "Eco Impact",
    emoji: "♻️",
    garmentEmoji: "♻️",
    steps: [
      { icon: "📸", title: "Scan It",         desc: "Quick scan documents the garment for environmental tracking." },
      { icon: "🗺️", title: "Find a Center",   desc: "Locate certified recycling facilities on the map." },
      { icon: "💬", title: "Chat & Arrange",   desc: "Agree on pick-up or drop-off timing with the center." },
      { icon: "🌍", title: "Confirm & Impact", desc: "Confirm completion, earn rewards, see your carbon offset!" },
    ],
  },
];

const MARQUEE_ITEMS = [
  "Scan to Decide ✦", "AI-Powered ✦", "Sustainable Fashion ✦", "Zero Waste ✦",
  "Give it a Second Life ✦", "Earn Rewards ✦", "Help Your Community ✦", "Be the Change ✦",
];

/* ─────────────────────────────────────────
   ORBITAL BADGE POSITIONS (N / E / S / W)
───────────────────────────────────────── */
const ORBITAL_POS = [
  { top: "-36px",  left: "50%",   transform: "translateX(-50%)" },
  { top: "50%",    right: "-96px", transform: "translateY(-50%)" },
  { bottom: "-36px", left: "50%", transform: "translateX(-50%)" },
  { top: "50%",    left: "-96px", transform: "translateY(-50%)" },
];

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function Home() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx,   setPrevIdx]   = useState<number | null>(null);
  const pageRef   = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  const current = CATEGORIES[activeIdx];

  const switchCategory = (i: number) => {
    const n = ((i % CATEGORIES.length) + CATEGORIES.length) % CATEGORIES.length;
    if (n === activeIdx) return;
    setPrevIdx(activeIdx);
    setActiveIdx(n);
  };

  /* ── cycling word entrance  ── */
  useEffect(() => {
    if (prevIdx === null) return;
    gsap.fromTo(".hero-cycling-word",
      { yPercent: 70, opacity: 0, skewX: 6 },
      { yPercent: 0,  opacity: 1, skewX: 0, duration: 0.5, ease: "back.out(1.8)" }
    );
    gsap.fromTo(".hero-copy-left",
      { opacity: 0.6 },
      { opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  }, [activeIdx, prevIdx]);

  /* ── mouse parallax ── */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ry = (e.clientY / window.innerHeight - 0.5) * 2;
    gsap.to(".parallax-slow", { x: rx * 18, y: ry * 14, ease: "power1.out", duration: 0.9 });
    gsap.to(".parallax-mid",  { x: rx * 32, y: ry * 24, ease: "power1.out", duration: 0.7 });
    gsap.to(".parallax-fast", { x: rx * 50, y: ry * 36, ease: "power1.out", duration: 0.5 });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  /* ── scanner animation color update ── */
  useEffect(() => {
    gsap.to(".scanner-inner-ring", {
      borderColor: current.color + "99",
      boxShadow: `0 0 60px ${current.color}22, inset 0 0 40px ${current.color}11`,
      duration: 0.4,
    });
    gsap.to(".scanner-outer-ring", {
      borderColor: current.color + "33",
      duration: 0.4,
    });
    gsap.to(".scanner-glow-blob", {
      background: `radial-gradient(circle, ${current.color}18 0%, transparent 70%)`,
      duration: 0.4,
    });
    // bounce the center emoji
    gsap.fromTo(".scanner-center-emoji",
      { scale: 0.8, opacity: 0 },
      { scale: 1,   opacity: 1, duration: 0.45, ease: "back.out(2)" }
    );
  }, [activeIdx, current.color]);

  /* ── entrance + continuous animations ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* hero entrance */
      gsap.from(".hero-badge",   { y: -24, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.3 });
      gsap.from(".hero-headline",{ y: 60,  opacity: 0, duration: 0.9, ease: "back.out(1.4)", delay: 0.5 });
      gsap.from(".hero-sub",     { y: 30,  opacity: 0, duration: 0.7, ease: "power2.out", delay: 0.85 });
      gsap.from(".hero-actions", { y: 20,  opacity: 0, duration: 0.7, ease: "power2.out", delay: 1.0 });
      gsap.from(".hero-cat-btn", { y: 20,  opacity: 0, stagger: 0.07, duration: 0.5, ease: "back.out(1.5)", delay: 1.1 });
      gsap.from(".hero-scanner", { scale: 0.75, opacity: 0, duration: 1.1, ease: "back.out(1.4)", delay: 0.6 });
      gsap.from(".orbital-badge",{ scale: 0, opacity: 0, stagger: 0.1, duration: 0.5, ease: "back.out(2)", delay: 1.3 });
      gsap.from(".parallax-slow > *", { opacity: 0, scale: 0, stagger: 0.1, duration: 0.6, ease: "back.out(1.5)", delay: 1.0 });

      /* scanner outer ring — slow spin */
      gsap.to(".scanner-outer-ring", { rotation: 360, duration: 18, ease: "linear", repeat: -1 });

      /* scan line sweeps top-to-bottom */
      gsap.fromTo(".scanner-line",
        { top: "10%" },
        { top: "90%", duration: 2.4, ease: "power1.inOut", yoyo: true, repeat: -1 }
      );

      /* center emoji subtle pulse */
      gsap.to(".scanner-center-emoji", {
        scale: 1.06, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1,
      });

      /* orbital badges float */
      gsap.utils.toArray<HTMLElement>(".orbital-badge").forEach((el, i) => {
        gsap.to(el, {
          y: -8, duration: 2 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.3,
        });
      });

      /* floating clothes in bg */
      gsap.utils.toArray<HTMLElement>(".float-cloth").forEach((el, i) => {
        gsap.to(el, {
          y: -16, rotation: `+=${6 - i * 2}`, duration: 3 + i * 0.5,
          ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.4,
        });
      });

      /* ── SCROLL-TRIGGERED sections ── */
      gsap.from(".path-title-reveal", {
        scrollTrigger: { trigger: "#pathway", start: "top 80%", toggleActions: "play none none reverse" },
        y: 40, opacity: 0, stagger: 0.12, duration: 0.7, ease: "back.out(1.4)",
      });

      /* Pathway step cards */
      const stepCards = gsap.utils.toArray<HTMLElement>(".step-card");
      stepCards.forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: { trigger: "#pathway", start: "top 70%", toggleActions: "play none none reverse" },
          y: 80, opacity: 0, rotate: [-4, 2, -2, 3][i % 4],
          duration: 0.7, delay: i * 0.1, ease: "back.out(1.5)",
        });
        card.addEventListener("mouseenter", () =>
          gsap.to(card, { y: -12, rotate: 0, scale: 1.04, duration: 0.2, ease: "power2.out" })
        );
        card.addEventListener("mouseleave", () =>
          gsap.to(card, { y: 0,   rotate: 0, scale: 1,    duration: 0.3, ease: "power2.out" })
        );
      });

      gsap.from(".feature-tile", {
        scrollTrigger: { trigger: "#features", start: "top 78%", toggleActions: "play none none reverse" },
        y: 50, opacity: 0, rotate: -2, stagger: 0.1, duration: 0.65, ease: "back.out(1.4)",
      });
      gsap.from(".reward-text-reveal", {
        scrollTrigger: { trigger: "#reward", start: "top 78%", toggleActions: "play none none reverse" },
        y: 30, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power2.out",
      });
      gsap.from(".reward-pet", {
        scrollTrigger: { trigger: "#reward", start: "top 85%", toggleActions: "play none none reverse" },
        y: 40, opacity: 0, duration: 0.8, ease: "back.out(1.5)",
      });
      gsap.from(".reward-tier", {
        scrollTrigger: { trigger: "#reward", start: "top 72%", toggleActions: "play none none reverse" },
        y: 40, opacity: 0, rotate: (i: number) => [-1, 0.6, -0.6, 1][i % 4],
        stagger: 0.12, duration: 0.7, ease: "back.out(1.5)",
      });
      gsap.from(".stat-box", {
        scrollTrigger: { trigger: "#stats", start: "top 80%", toggleActions: "play none none reverse" },
        scale: 0.85, opacity: 0, stagger: 0.1, duration: 0.65, ease: "back.out(1.5)",
      });
      gsap.from(".cta-card", {
        scrollTrigger: { trigger: "#cta", start: "top 80%", toggleActions: "play none none reverse" },
        scale: 0.92, opacity: 0, duration: 0.8, ease: "back.out(1.3)",
      });
      gsap.from(".onboard-step", {
        scrollTrigger: { trigger: ".onboard-steps", start: "top 80%", toggleActions: "play none none reverse" },
        y: 50, opacity: 0, stagger: 0.15, duration: 0.7, ease: "back.out(1.4)",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="overflow-x-hidden bg-[#f8fafc]">
      <Navbar />

      {/* ════════════════════════════════════════════
          HERO  —  light · orbital scanner · mouse parallax
      ════════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-screen bg-gradient-to-br from-white via-[#f0fdf4] to-[#eff6ff] overflow-hidden flex items-center">

        {/* ── floating parallax background ── */}
        <div className="parallax-slow absolute inset-0 pointer-events-none select-none">
          {/* large color glow blobs */}
          <div className="scanner-glow-blob absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${current.color}20 0%, transparent 70%)`, transform: "translate(30%,-30%)" }} />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)", transform: "translate(-30%,30%)" }} />

          {/* floating clothing items */}
          {[
            { e: "👗", t: "12%",  l: "6%",   s: "3.2rem", o: 0.09 },
            { e: "🧥", t: "70%",  l: "4%",   s: "2.8rem", o: 0.07 },
            { e: "👔", t: "18%",  r: "6%",   s: "2.4rem", o: 0.08 },
            { e: "👖", t: "75%",  r: "5%",   s: "3rem",   o: 0.07 },
            { e: "👟", t: "45%",  l: "1%",   s: "2rem",   o: 0.06 },
            { e: "🧤", t: "35%",  r: "2%",   s: "2.2rem", o: 0.06 },
          ].map((f, i) => (
            <span
              key={i}
              className="float-cloth absolute"
              style={{
                top: f.t, left: (f as {l?: string}).l, right: (f as {r?: string}).r,
                fontSize: f.s, opacity: f.o,
              }}
            >{f.e}</span>
          ))}
        </div>

        {/* ── mid layer (faster parallax) ── */}
        <div className="parallax-mid absolute inset-0 pointer-events-none select-none">
          <div className="absolute top-1/4 left-[15%] w-2 h-2 rounded-full opacity-30" style={{ background: current.color }} />
          <div className="absolute top-2/3 right-[18%] w-3 h-3 rounded-full opacity-20" style={{ background: current.color }} />
          <div className="absolute top-1/2 left-[10%] w-1.5 h-1.5 rounded-full opacity-25" style={{ background: "#5CDE71" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center py-32 md:py-28">

          {/* ── LEFT COPY ── */}
          <div className="hero-copy-left">
            <div className="hero-badge inline-flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-full px-4 py-2 text-xs font-semibold text-[#22c55e] mb-8 shadow-sm">
              <span className="pulse-dot" />
              AI-Powered Wardrobe Intelligence
            </div>

            <div className="overflow-hidden mb-1">
              <h1 className="hero-headline font-display font-extrabold text-[clamp(3rem,7vw,5.5rem)] leading-[1.0] text-[#0f172a]">
                One scan.
              </h1>
            </div>
            <div className="overflow-hidden mb-6">
              <h1 className="font-display font-extrabold text-[clamp(3rem,7vw,5.5rem)] leading-[1.0]">
                <span
                  className="hero-cycling-word inline-block"
                  style={{ color: current.color }}
                >
                  {current.label} it.
                </span>
              </h1>
            </div>

            <p className="hero-sub text-slate-500 text-lg leading-relaxed max-w-md mb-8">
              Point your camera at any garment. Our AI reads the fabric, condition, and style — then tells you exactly whether to{" "}
              <strong className="text-[#0f172a]">sell</strong>,{" "}
              <strong className="text-[#0f172a]">donate</strong>,{" "}
              <strong className="text-[#0f172a]">upcycle</strong>, or{" "}
              <strong className="text-[#0f172a]">recycle</strong> it.
            </p>

            <div className="hero-actions flex flex-wrap gap-3 mb-10">
              <a
                href="/scan"
                className="glow-btn inline-flex items-center gap-2 bg-[#22c55e] text-white font-extrabold px-8 py-4 rounded-full text-base transition-all hover:scale-105 shadow-lg"
              >
                Start Scanning →
              </a>
              <a
                href="/register"
                className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-white font-semibold px-8 py-4 rounded-full text-base transition-all bg-white/60"
              >
                Create Account
              </a>
            </div>

            {/* 4 interactive category pills */}
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  className="hero-cat-btn flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all duration-300 hover:scale-105"
                  style={{
                    background:   activeIdx === i ? cat.color    : "#ffffff",
                    borderColor:  activeIdx === i ? cat.color    : "#e2e8f0",
                    color:        activeIdx === i ? "#fff"        : "#64748b",
                    boxShadow:    activeIdx === i ? `0 4px 20px ${cat.color}44` : "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                  onClick={() => switchCategory(i)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: ORBITAL SCANNER ── */}
          <div className="parallax-fast relative flex items-center justify-center py-16 md:py-0">
            <div ref={scannerRef} className="hero-scanner relative w-64 h-64 md:w-80 md:h-80" style={{ overflow: "visible" }}>

              {/* glow blob behind */}
              <div className="absolute inset-0 scale-150 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${current.color}14 0%, transparent 65%)` }} />

              {/* outer dashed rotating ring */}
              <div
                className="scanner-outer-ring absolute inset-0 rounded-full border border-dashed"
                style={{ borderColor: current.color + "44" }}
              />

              {/* inner solid ring with glow */}
              <div
                className="scanner-inner-ring absolute inset-8 rounded-full border-2"
                style={{
                  borderColor: current.color + "88",
                  boxShadow:   `0 0 60px ${current.color}22, inset 0 0 40px ${current.color}11`,
                }}
              />

              {/* scan line sweep */}
              <div
                className="scanner-line absolute left-8 right-8 h-px rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, ${current.color}cc, transparent)`,
                  top: "20%",
                  boxShadow:  `0 0 8px ${current.color}`,
                }}
              />

              {/* center garment emoji */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="scanner-center-emoji text-[4.5rem] md:text-[5.5rem] select-none drop-shadow-2xl">
                  {current.garmentEmoji}
                </span>
              </div>

              {/* corner tick marks */}
              {[
                { top: "8px",    left:  "8px",    border: "border-t-2 border-l-2 rounded-tl-lg" },
                { top: "8px",    right: "8px",    border: "border-t-2 border-r-2 rounded-tr-lg" },
                { bottom: "8px", left:  "8px",    border: "border-b-2 border-l-2 rounded-bl-lg" },
                { bottom: "8px", right: "8px",    border: "border-b-2 border-r-2 rounded-br-lg" },
              ].map((c, i) => (
                <div
                  key={i}
                  className={`absolute w-6 h-6 ${c.border}`}
                  style={{
                    top: c.top, left: (c as {left?: string}).left, right: (c as {right?: string}).right,
                    bottom: (c as {bottom?: string}).bottom,
                    borderColor: current.color,
                  }}
                />
              ))}

              {/* 4 ORBITAL BADGES  N / E / S / W */}
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  className="orbital-badge absolute flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-full border-2 transition-all duration-300 hover:scale-110 whitespace-nowrap"
                  style={{
                    ...ORBITAL_POS[i],
                    background:  activeIdx === i ? cat.color : "#ffffff",
                    borderColor: activeIdx === i ? cat.color : "#e2e8f0",
                    color:       activeIdx === i ? "#fff"    : "#64748b",
                    boxShadow:   activeIdx === i ? `0 4px 20px ${cat.color}55` : "0 2px 12px rgba(0,0,0,0.08)",
                  }}
                  onClick={() => switchCategory(i)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* bottom fade to light */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(transparent, #f8fafc)" }} />
      </section>

      {/* ════════════════════════════════════════════
          MARQUEE
      ════════════════════════════════════════════ */}
      <div className="border-y border-[#e2e8f0] py-4 overflow-hidden bg-white">
        <div className="marquee-track text-[#94a3b8] text-xs font-bold uppercase tracking-widest">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="whitespace-nowrap pr-12">{item}</span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          PATHWAY  —  steps per category
          (pathway tabs update when hero orbs are clicked)
      ════════════════════════════════════════════ */}
      <section id="pathway" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* header */}
          <div className="text-center mb-14">
            <span className="path-title-reveal inline-block text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: current.color }}>
              The {current.label} Pathway
            </span>
            <h2 className="path-title-reveal font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-[#0f172a] mb-4">
              Here's exactly how it works
            </h2>
            <p className="path-title-reveal text-slate-500 max-w-xl mx-auto">
              Simple, transparent steps from scan to completion — no guessing, no friction.
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex justify-center gap-3 flex-wrap mb-14">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.id}
                className="px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all duration-200 hover:scale-105"
                style={{
                  background:  activeIdx === i ? cat.color : "#ffffff",
                  borderColor: activeIdx === i ? cat.color : "#e2e8f0",
                  color:       activeIdx === i ? "#fff"    : "#64748b",
                  boxShadow:   activeIdx === i ? `0 4px 16px ${cat.color}44` : "0 2px 8px rgba(0,0,0,0.06)",
                }}
                onClick={() => switchCategory(i)}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Step cards — stacked / tilted like Maxima reference */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {current.steps.map((step, i) => {
              const tilts = [-2.5, 1.5, -1.5, 2.5];
              return (
                <div
                  key={`${current.id}-${i}`}
                  className="step-card relative rounded-3xl p-7 cursor-pointer"
                  style={{
                    background:   i % 2 === 0 ? "#ffffff" : `${current.color}10`,
                    border:       `2px solid ${i % 2 === 0 ? "#e2e8f0" : current.color + "44"}`,
                    transform:    `rotate(${tilts[i]}deg)`,
                    boxShadow:    i % 2 === 0 ? "0 8px 32px rgba(15,23,42,0.08)" : `0 8px 32px ${current.color}22`,
                  }}
                >
                  {/* step number */}
                  <div
                    className="absolute -top-4 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-lg"
                    style={{ background: current.color }}
                  >
                    {i + 1}
                  </div>

                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5"
                    style={{ background: `${current.color}18` }}
                  >
                    {step.icon}
                  </div>

                  <h3 className="font-bold text-[#0f172a] text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>

                  {/* connector arrow */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 text-xl font-bold z-10"
                      style={{ color: current.color }}>
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-14">
            <a
              href="/scan"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-white text-base transition-all hover:scale-105"
              style={{ background: current.color, boxShadow: `0 12px 32px ${current.color}44` }}
            >
              Start {current.label}ing Now →
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#22c55e] mb-4">
              Why Scan First?
            </span>
            <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-[#0f172a] mb-4">
              One scan. Infinite possibilities.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Our AI doesn't just look at your clothes — it understands them. Then gives you the smartest path forward.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🤖", title: "AI Recognition",      desc: "Fabric type, condition, style, and market value read in seconds.", color: "#22c55e" },
              { icon: "📋", title: "Smart Recommendations",desc: "Based on condition, AI picks the best option: sell, donate, upcycle, or recycle.", color: "#f97316" },
              { icon: "📍", title: "Location-Aware",       desc: "Finds nearest donation centers, UMKM artisans, and recycling facilities.", color: "#3b82f6" },
              { icon: "💬", title: "In-App Chat",          desc: "Connect and negotiate with donation centers and UMKM right inside the app.", color: "#a855f7" },
              { icon: "📅", title: "Scheduling",           desc: "Agree on pick-up or delivery dates. Both parties get calendar reminders.", color: "#06b6d4" },
              { icon: "🌱", title: "Impact Tracking",      desc: "Every action is tracked. See how much waste you've prevented over time.", color: "#ec4899" },
            ].map((f, i) => (
              <div
                key={i}
                className="feature-tile bg-white border border-[#e2e8f0] rounded-2xl p-7 cursor-default"
                style={{ transform: `rotate(${[-1, 0.8, -0.5, 1, -0.8, 0.5][i]}deg)`, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${f.color}15` }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#0f172a] text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          REWARD SYSTEM
      ════════════════════════════════════════════ */}
      <section id="reward" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="reward-text-reveal inline-block text-xs font-bold uppercase tracking-widest text-[#22c55e] mb-4">
                The Reward System
              </span>
              <h2 className="reward-text-reveal font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-[#0f172a] mb-4 leading-tight">
                Do good,<br />
                <span className="gradient-text">grow your pet. 🐣</span>
              </h2>
              <p className="reward-text-reveal text-slate-500 leading-relaxed mb-8">
                Every completed action earns reward points. Spend those points to unlock rewards and keep your virtual companion happy and growing.
              </p>

              <div className="flex flex-col gap-4">
                {[
                  { icon: "🥚", tier: "Eco Egg",   pts: "0 pts",   desc: "Just hatched — welcome to WearWise!" },
                  { icon: "🐣", tier: "Sprout",     pts: "100 pts", desc: "Your pet hatches! First scan logged." },
                  { icon: "🐥", tier: "Bloom",      pts: "300 pts", desc: "Growing fast — 3+ actions done." },
                  { icon: "🌿", tier: "Guardian",   pts: "700 pts", desc: "An eco-warrior. Your pet thrives!" },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="reward-tier flex items-center gap-4 bg-white border border-[#e2e8f0] rounded-2xl px-6 py-4"
                    style={{ transform: `rotate(${[-1, 0.6, -0.6, 1][i]}deg)`, boxShadow: "0 4px 20px rgba(15,23,42,0.07)" }}
                  >
                    <span className="text-3xl">{t.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-[#0f172a]">{t.tier}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "#22c55e22", color: "#16a34a" }}>{t.pts}</span>
                      </div>
                      <p className="text-sm text-slate-500">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="reward-pet text-center">
                <div className="w-64 h-64 rounded-full mx-auto flex items-center justify-center text-9xl select-none"
                  style={{ background: "radial-gradient(circle, #22c55e22 0%, transparent 70%)", animation: "petBob 2.5s ease-in-out infinite" }}>
                  🌿
                </div>
                <p className="font-display font-extrabold text-2xl text-[#0f172a] mt-6">Guardian</p>
                <p className="text-slate-500 text-sm mt-1">Your eco-companion, level 4</p>
                <div className="mt-4 bg-slate-100 border border-slate-200 rounded-full h-3 overflow-hidden mx-8">
                  <div className="h-full rounded-full" style={{ width: "72%", background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
                </div>
                <p className="text-xs text-slate-400 mt-2">720 / 1000 pts to next level</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`@keyframes petBob { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-16px) rotate(3deg)} }`}</style>

      {/* ════════════════════════════════════════════
          HOW TO GET STARTED
      ════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#22c55e] mb-4">
            How to Get Started
          </span>
          <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-[#0f172a] mb-4">
            Three steps, infinite impact
          </h2>
          <p className="text-slate-500 mb-14 max-w-xl mx-auto">Your onboarding journey, simplified.</p>

          <div className="onboard-steps relative flex flex-col md:flex-row gap-8 items-start justify-center">
            <div className="hidden md:block absolute top-14 left-[16.5%] right-[16.5%] h-0.5 rounded-full"
              style={{ background: "linear-gradient(90deg, #22c55e, #3b82f6, #a855f7)" }} />
            {[
              { n:"1", icon:"🌱", title:"Create Account",    desc:"Sign up in under a minute. Set your profile, location, and preferences.", color:"#22c55e" },
              { n:"2", icon:"📸", title:"Scan a Garment",    desc:"Take a photo of any clothing item. AI does the rest.", color:"#3b82f6" },
              { n:"3", icon:"🎯", title:"Choose Your Path",  desc:"Pick Sell, Donate, Upcycle, or Recycle. Complete and earn rewards.", color:"#a855f7" },
            ].map((s, i) => (
              <div key={i} className="onboard-step flex flex-col items-center text-center flex-1">
                <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-5xl mb-4 border-2"
                  style={{ background:`${s.color}12`, borderColor:s.color, transform:`rotate(${[-3,0,3][i]}deg)`, boxShadow:`0 8px 32px ${s.color}22` }}>
                  {s.icon}
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mb-3 -mt-2"
                  style={{ background:s.color }}>{s.n}</div>
                <h3 className="font-bold text-[#0f172a] text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════ */}
      <section id="stats" className="py-20 px-6 border-y border-[#e2e8f0] bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n:"10K+", label:"Clothes Saved",  icon:"👗", color:"#22c55e" },
            { n:"4",    label:"Action Paths",   icon:"🛤️", color:"#f97316" },
            { n:"98%",  label:"Happy Users",    icon:"😊", color:"#3b82f6" },
            { n:"0",    label:"Waste Target",   icon:"🌍", color:"#a855f7" },
          ].map((s, i) => (
            <div key={i} className="stat-box bg-white border border-[#e2e8f0] rounded-2xl p-6 text-center"
              style={{ transform:`rotate(${[-1.5,1,-0.8,1.5][i]}deg)`, boxShadow:"0 4px 24px rgba(15,23,42,0.07)" }}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold mb-1" style={{ color:s.color }}>{s.n}</p>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════ */}
      <section id="cta" className="py-28 px-6 bg-[#f8fafc]">
        <div className="cta-card max-w-2xl mx-auto text-center rounded-[2.5rem] p-14 relative overflow-hidden"
          style={{ background:"linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #eff6ff 100%)", border:"1.5px solid #e2e8f0", boxShadow:"0 24px 80px rgba(34,197,94,0.12), 0 8px 32px rgba(15,23,42,0.08)" }}>
          <div className="absolute top-0 left-1/4 w-48 h-48 rounded-full pointer-events-none"
            style={{ background:"radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)", transform:"translateY(-50%)" }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full pointer-events-none"
            style={{ background:"radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)", transform:"translateY(50%)" }} />
          <span className="relative inline-block text-xs font-bold uppercase tracking-widest text-[#22c55e] mb-6">
            Your Wardrobe Awaits
          </span>
          <h2 className="relative font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-[#0f172a] mb-4 leading-tight">
            Start with one piece.<br />Change everything. 🌱
          </h2>
          <p className="relative text-slate-500 mb-10 leading-relaxed">
            Join thousands of people making smarter, more sustainable decisions for their wardrobe.
          </p>
          <div className="relative flex flex-wrap gap-4 justify-center">
            <a href="/scan" className="glow-btn inline-flex items-center gap-2 bg-[#22c55e] text-white font-bold px-8 py-4 rounded-full text-base shadow-lg">
              Scan Your Clothes Now →
            </a>
            <a href="/register" className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-white font-semibold px-8 py-4 rounded-full text-base transition-all bg-white/80">
              Create Account
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer className="border-t border-[#e2e8f0] py-10 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display font-extrabold text-xl text-[#0f172a]">WearWise <span style={{ color:"#22c55e" }}>🌱</span></p>
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} WearWise. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-[#22c55e] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#22c55e] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#22c55e] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}