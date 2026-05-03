"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export default function Login() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(".login-card", {
        scale: 0.9,
        y: 60,
        opacity: 0,
        duration: 1.2,
      })
      .from(".stagger-field", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
      }, "-=0.8");

      // Background animations
      gsap.to(".blob-1", {
        x: "30vw",
        y: "10vh",
        duration: 15,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
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

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Handle successful login (e.g., set cookie, redirect)
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={formRef} className="min-h-screen bg-[#f8fafc] overflow-hidden relative">
      <Navbar />
      
      <div className="blob-1 absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-green-100/40 blur-3xl pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="login-card bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Sign in to continue your sustainable journey</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="stagger-field">
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all"
              />
            </div>

            <div className="stagger-field">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <Link href="/forgot" className="text-xs font-bold text-green-500 hover:underline">Forgot password?</Link>
              </div>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 outline-none transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-lg shadow-lg shadow-green-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In →"
              )}
            </button>

            <p className="text-center text-sm text-slate-500 mt-8">
              Don't have an account? <Link href="/register" className="text-green-500 font-bold hover:underline">Create one</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
