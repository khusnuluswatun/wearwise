"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Navbar from "@/components/ui/Navbar";

/* ─── Types ─────────────────────────────────────── */
interface ScanResult {
  item: string;
  condition: string;
  conditionScore: number;
  fabric: string;
  color: string;
  recommendation: "Sell" | "Donate" | "Upcycle" | "Recycle";
  recommendationEmoji: string;
  recommendationColor: string;
  reasoning: string;
  sellPrice: string | null;
  tags: string[];
  tips: string;
}

const REC_BG: Record<string, string> = {
  Sell:    "from-orange-50  to-amber-50",
  Donate:  "from-blue-50    to-sky-50",
  Upcycle: "from-purple-50  to-violet-50",
  Recycle: "from-emerald-50 to-green-50",
};

/* ─── Component ─────────────────────────────────── */
export default function ScanPage() {
  const [preview, setPreview]     = useState<string | null>(null);
  const [file,    setFile]        = useState<File | null>(null);
  const [loading, setLoading]     = useState(false);
  const [result,  setResult]      = useState<ScanResult | null>(null);
  const [error,   setError]       = useState<string | null>(null);
  const [camera,  setCamera]      = useState(false);

  const inputRef  = useRef<HTMLInputElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".scan-header > *", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out"
      });
      gsap.from(".upload-card", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        delay: 0.3
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    if (result) {
      gsap.from(".result-stagger", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "back.out(1.4)",
        delay: 0.1
      });
      gsap.from(".condition-bar", {
        scaleX: 0,
        transformOrigin: "left",
        duration: 1.5,
        ease: "power4.out",
        delay: 0.5
      });
    }
  }, [result]);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }, [handleFile]);

  /* ─── camera ─── */
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setError("Kamera tidak dapat diakses. Gunakan upload file.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      handleFile(f);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamera(false);
  };

  /* ─── analyse ─── */
  const analyse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/scan", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menganalisis");
      setResult(json.data as ScanResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
  };

  /* ─── render ─── */
  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-20">

        {/* ── Header ── */}
        <div className="scan-header text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-full px-4 py-2 text-xs font-semibold text-[#22c55e] mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            WearWise AI Scanner
          </span>
          <h1 className="font-display font-extrabold text-[clamp(2rem,5vw,3.2rem)] text-[#0f172a] leading-tight mb-3">
            Scan pakaianmu,<br />
            <span style={{
              background: "linear-gradient(135deg, #22c55e 0%, #3b82f6 50%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>AI yang putuskan.</span>
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-base">
            Upload foto pakaian — AI kami analisis kondisi, bahan, dan rekomendasikan tindakan terbaik secara instan.
          </p>
        </div>

        {/* ── Camera modal ── */}
        {camera && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            <video
              ref={videoRef}
              className="w-full max-w-sm rounded-2xl object-cover"
              playsInline
              muted
            />
            <div className="flex gap-4 mt-6">
              <button
                onClick={takePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-[#22c55e] flex items-center justify-center text-2xl shadow-xl hover:scale-105 transition-all"
              >
                📸
              </button>
              <button
                onClick={closeCamera}
                className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl hover:bg-white/30 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── Upload area ── */}
        {!result && (
          <div className="upload-card bg-white rounded-3xl border border-[#e2e8f0] shadow-sm overflow-hidden">

            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl m-4 transition-all duration-300 ${
                preview ? "border-[#22c55e] bg-emerald-50/40" : "border-[#e2e8f0] hover:border-[#22c55e] hover:bg-emerald-50/20"
              }`}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
            >
              {preview ? (
                /* Preview */
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-[380px] object-contain rounded-xl"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white border border-[#e2e8f0] shadow-md flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-all text-base"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a] border border-[#e2e8f0]">
                    {file?.name}
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="py-16 flex flex-col items-center gap-4 cursor-pointer" onClick={() => inputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-4xl">
                    👕
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#0f172a] text-base mb-1">Drag & drop foto pakaian</p>
                    <p className="text-slate-400 text-sm">atau klik untuk memilih file</p>
                    <p className="text-slate-300 text-xs mt-2">JPG, PNG, WebP — Max 10MB</p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* Action buttons */}
            <div className="px-4 pb-4 flex flex-col sm:flex-row gap-3">
              {!preview ? (
                <>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#f8fafc] border-2 border-[#e2e8f0] text-slate-600 font-semibold py-3 rounded-2xl hover:border-[#22c55e] hover:text-[#22c55e] transition-all"
                  >
                    📁 Pilih dari Gallery
                  </button>
                  <button
                    onClick={openCamera}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#f8fafc] border-2 border-[#e2e8f0] text-slate-600 font-semibold py-3 rounded-2xl hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all"
                  >
                    📷 Gunakan Kamera
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={reset}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#f8fafc] border-2 border-[#e2e8f0] text-slate-600 font-semibold py-3 rounded-2xl hover:border-red-300 hover:text-red-500 transition-all"
                  >
                    🔄 Ganti Foto
                  </button>
                  <button
                    onClick={analyse}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#22c55e] text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-[#16a34a] hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100"
                    style={{ boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Menganalisis...
                      </>
                    ) : (
                      <>🤖 Analisis Sekarang</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="mt-6 bg-white rounded-3xl border border-[#e2e8f0] p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-[#e2e8f0]" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#22c55e] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-[#0f172a] text-lg mb-1">AI sedang menganalisis…</p>
                <p className="text-slate-400 text-sm">Membaca bahan, kondisi, dan nilai pakaianmu</p>
              </div>
              <div className="w-full space-y-3">
                {["Detecting garment type…", "Analyzing fabric condition…", "Calculating recommendation…"].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 animate-pulse flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full flex-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#22c55e] to-[#3b82f6] rounded-full animate-pulse"
                        style={{ width: `${70 + i * 10}%`, animationDelay: `${i * 0.2}s` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-semibold text-red-700 mb-1">Terjadi kesalahan</p>
              <p className="text-red-600 text-sm">{error}</p>
              {error.includes("API_KEY") && (
                <p className="text-red-500 text-xs mt-2">
                  💡 Tambahkan <code className="bg-red-100 px-1 rounded">GEMINI_API_KEY</code> di file{" "}
                  <code className="bg-red-100 px-1 rounded">.env.local</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            RESULT CARD
        ══════════════════════════════════════ */}
        {result && (
          <div className="space-y-5">

            {/* ── Hero result ── */}
            <div
              className={`result-stagger bg-gradient-to-br ${REC_BG[result.recommendation]} rounded-3xl border border-[#e2e8f0] overflow-hidden shadow-sm`}
            >
              <div className="grid md:grid-cols-2 gap-0">

                {/* Photo */}
                <div className="relative bg-white/60 m-4 rounded-2xl overflow-hidden min-h-[220px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview!} alt="Scanned item" className="w-full max-h-[300px] object-contain" />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-[#e2e8f0] shadow flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col justify-center">
                  {/* recommendation badge */}
                  <div
                    className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full text-white text-sm font-bold mb-4 shadow-lg"
                    style={{
                      background: result.recommendationColor,
                      boxShadow: `0 8px 24px ${result.recommendationColor}44`,
                    }}
                  >
                    {result.recommendationEmoji} {result.recommendation}
                  </div>

                  <h2 className="font-display font-extrabold text-2xl text-[#0f172a] mb-1">{result.item}</h2>
                  <p className="text-slate-500 text-sm mb-5">{result.color} · {result.fabric}</p>

                  {/* Condition bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Kondisi</span>
                      <span style={{ color: result.recommendationColor }}>{result.condition} ({result.conditionScore}%)</span>
                    </div>
                    <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="condition-bar h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${result.conditionScore}%`,
                          background: `linear-gradient(90deg, ${result.recommendationColor}, ${result.recommendationColor}bb)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {result.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ background: `${result.recommendationColor}15`, color: result.recommendationColor }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA button */}
                  <button
                    className="w-full py-3 rounded-2xl font-bold text-white text-sm shadow-lg hover:scale-[1.02] transition-all"
                    style={{
                      background: result.recommendationColor,
                      boxShadow: `0 8px 20px ${result.recommendationColor}44`,
                    }}
                  >
                    {result.recommendationEmoji} Lanjutkan {result.recommendation}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Detail cards row ── */}
            <div className="result-stagger grid sm:grid-cols-2 gap-4">

              {/* Reasoning */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Mengapa ini?</p>
                <p className="text-[#0f172a] text-sm leading-relaxed">{result.reasoning}</p>
              </div>

              {/* Tips + Price */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">💡 Tips</p>
                  <p className="text-[#0f172a] text-sm leading-relaxed">{result.tips}</p>
                </div>
                {result.sellPrice && (
                  <div
                    className="rounded-2xl p-5 shadow-sm"
                    style={{ background: `${result.recommendationColor}10`, border: `1px solid ${result.recommendationColor}30` }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: result.recommendationColor }}>
                      💰 Estimasi Harga Jual
                    </p>
                    <p className="font-display font-extrabold text-xl text-[#0f172a]">{result.sellPrice}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Action paths ── */}
            <div className="result-stagger bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Pilihan Lain</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Sell",    emoji: "🏷️", color: "#FF8C42" },
                  { label: "Donate",  emoji: "🤝", color: "#4DAAFF" },
                  { label: "Upcycle", emoji: "✂️", color: "#B06AFF" },
                  { label: "Recycle", emoji: "♻️", color: "#2DCB73" },
                ].map(({ label, emoji, color }) => (
                  <button
                    key={label}
                    className="py-3 rounded-xl text-sm font-semibold border-2 text-center transition-all hover:scale-105"
                    style={{
                      background: result.recommendation === label ? color : "white",
                      borderColor: result.recommendation === label ? color : "#e2e8f0",
                      color: result.recommendation === label ? "white" : "#64748b",
                      boxShadow: result.recommendation === label ? `0 4px 16px ${color}44` : "none",
                    }}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Scan again ── */}
            <div className="flex justify-center pt-2">
              <button
                onClick={reset}
                className="flex items-center gap-2 text-slate-500 hover:text-[#22c55e] font-semibold text-sm transition-colors"
              >
                🔄 Scan pakaian lain
              </button>
            </div>
          </div>
        )}

        {/* ── Tips row ── */}
        {!result && !loading && (
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { icon: "💡", title: "Foto yang baik", desc: "Ambil foto dengan pencahayaan cukup, latar polos lebih baik." },
              { icon: "🎯", title: "Tampilkan seluruh item", desc: "Pastikan pakaian terlihat lengkap dari atas ke bawah." },
              { icon: "⚡", title: "Analisis instan", desc: "Hasil lengkap dalam hitungan detik menggunakan Gemini AI." },
            ].map((tip, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <p className="font-semibold text-[#0f172a] text-sm mb-1">{tip.title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
