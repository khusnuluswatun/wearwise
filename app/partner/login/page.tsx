"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { Leaf } from "lucide-react";

export default function PartnerLogin() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");



  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".partner-card", { scale: 0.92, y: 50, opacity: 0, duration: 1.1, ease: "back.out(1.4)" });
      gsap.from(".stagger-field", { y: 20, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out", delay: 0.3 });
      gsap.to(".blob-green", { x: "20vw", y: "8vh", duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".blob-blue", { x: "-15vw", y: "15vh", duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, formRef);
    return () => ctx.revert();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login gagal");

      if (data.user.role !== "partner") {
        throw new Error("Akun ini bukan akun partner donasi. Gunakan login user biasa.");
      }

      localStorage.setItem("partner_user", JSON.stringify(data.user));
      window.location.href = "/partner/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={formRef} className="min-h-screen bg-[#f8fafc] overflow-hidden relative flex items-center justify-center px-4">
      
      {/* Decorative blobs */}
      <div className="blob-green absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-green-100/40 blur-3xl pointer-events-none" />
      <div className="blob-blue absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />

      <div className="partner-card bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-3 rounded-2xl shadow-lg shadow-green-500/30">
              <Leaf size={32} strokeWidth={2.5} />
            </div>
            <span className="text-3xl font-display font-extrabold text-slate-800 tracking-tight">
              WearWise
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Partner Portal</h1>
          <p className="text-slate-500 text-sm">Masuk sebagai tempat donasi / yayasan</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="stagger-field">
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Partner</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="partner@yayasan.org"
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/60 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all"
            />
          </div>

          <div className="stagger-field">
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/60 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-lg shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Masuk ke Dashboard →"
            )}
          </button>

          <div className="pt-2 text-center text-sm text-slate-400">
            Login sebagai user biasa?{" "}
            <Link href="/login" className="text-blue-500 font-bold hover:underline">
              Klik di sini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
