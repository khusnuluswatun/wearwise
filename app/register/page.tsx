"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export default function Register() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "user",
    partnerType: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create a timeline for entrance
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(".register-card", {
        scale: 0.9,
        y: 100,
        opacity: 0,
        duration: 1.2,
      })
      .from(".side-title", {
        x: -50,
        opacity: 0,
        duration: 1,
      }, "-=0.8")
      .from(".stagger-field", {
        y: 20,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
      }, "-=0.6")
      .from(".info-pill", {
        scale: 0,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.5");

      // Floating background blobs
      gsap.to(".blob-1", {
        x: "50vw",
        y: "20vh",
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      gsap.to(".blob-2", {
        x: "-30vw",
        y: "-10vh",
        duration: 25,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2
      });

      // Mouse Parallax Effect
      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 40;
        const yPos = (clientY / window.innerHeight - 0.5) * 40;

        gsap.to(".parallax-bg", {
          x: xPos,
          y: yPos,
          duration: 1,
          ease: "power2.out"
        });

        gsap.to(".parallax-card", {
          x: xPos * -0.5,
          y: yPos * -0.5,
          duration: 1,
          ease: "power2.out"
        });
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, formRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(true);
      setFormData({ name: "", email: "", password: "", phone: "", address: "", role: "user", partnerType: "" });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div ref={formRef} className="min-h-screen bg-[#f8fafc] overflow-hidden relative">
      <Navbar />
      
      {/* Decorative Background Elements */}
      <div className="blob-1 absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-green-100/50 blur-3xl pointer-events-none" />
      <div className="blob-2 absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-full grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Side Content */}
          <div className="side-content hidden lg:block space-y-8 parallax-bg">
            <div className="space-y-4">
              <span className="info-pill inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-bold tracking-wide">
                JOIN THE COMMUNITY
              </span>
              <h1 className="side-title text-6xl font-display font-extrabold text-slate-900 leading-tight">
                Be a Part of the <span className="text-green-500">Green</span> Revolution.
              </h1>
              <p className="side-title text-lg text-slate-500 leading-relaxed max-w-lg">
                Join thousands of users who are changing the way we think about fashion. Scan, sell, donate, or upcycle with WearWise.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: "🌱", label: "Eco-Friendly", sub: "Save the planet" },
                { icon: "💰", label: "Earn Rewards", sub: "Get points" },
                { icon: "🤝", label: "Donate Easy", sub: "Help others" },
                { icon: "🎨", label: "Upcycle Art", sub: "Be creative" },
              ].map((item, i) => (
                <div key={i} className="info-pill flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-hover hover:shadow-md">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Registration Form Card */}
          <div className="register-card parallax-card bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden w-full max-w-xl mx-auto">
            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-display font-extrabold text-slate-900">Create Account</h2>
              <p className="text-slate-500">Already have an account? <Link href="/login" className="text-green-500 font-bold hover:underline">Login</Link></p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium animate-shake">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-2xl text-sm font-medium">
                ✅ Registration successful! Redirecting to login...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="stagger-field">
                <label className="block text-sm font-bold text-slate-700 mb-2">I am registering as a</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "user", partnerType: "" })}
                    className={`py-3 px-4 rounded-2xl border-2 font-bold transition-all ${
                      formData.role === "user"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-green-200"
                    }`}
                  >
                    👤 Regular User
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "partner", partnerType: "umkm" })}
                    className={`py-3 px-4 rounded-2xl border-2 font-bold transition-all ${
                      formData.role === "partner"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-green-200"
                    }`}
                  >
                    🏪 Partner
                  </button>
                </div>
              </div>

              {formData.role === "partner" && (
                <div className="stagger-field animate-fade-in-up">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Partner Type</label>
                  <select
                    name="partnerType"
                    value={formData.partnerType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, partnerType: e.target.value })}
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all text-slate-700"
                  >
                    <option value="umkm">UMKM (Upcycle / Fashion)</option>
                    <option value="tempat donasi">Tempat Donasi</option>
                    <option value="tempat recycle">Tempat Recycle</option>
                  </select>
                </div>
              )}

              <div className="stagger-field">
                <label className="block text-sm font-bold text-slate-700 mb-2">{formData.role === "partner" ? "Organization Name" : "Full Name"}</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="stagger-field">
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="stagger-field">
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="stagger-field">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+62..."
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <div className="stagger-field">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Address</label>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, City, Zip"
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="stagger-field pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-lg shadow-lg shadow-green-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Join WearWise →"
                  )}
                </button>
              </div>

              <p className="stagger-field text-center text-xs text-slate-400 mt-6">
                By signing up, you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span>.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
