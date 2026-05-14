"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Loader2 } from "lucide-react";

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
  Sell: "from-orange-50  to-amber-50",
  Donate: "from-blue-50    to-sky-50",
  Upcycle: "from-purple-50  to-violet-50",
  Recycle: "from-emerald-50 to-green-50",
};

/* ─── Component ─────────────────────────────────── */
export default function ScanFeature() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [finalChoice, setFinalChoice] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [donateQueueCount, setDonateQueueCount] = useState(0);

  useEffect(() => {
    // Read queue count on mount
    const existingSell = JSON.parse(localStorage.getItem("wearwise_sell_draft_list") || "[]");
    setQueueCount(existingSell.length);
    const existingDonate = JSON.parse(localStorage.getItem("wearwise_donate_draft_list") || "[]");
    setDonateQueueCount(existingDonate.length);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    setFinalChoice(null);
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
      setError("Camera cannot be accessed. Use file upload.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
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
    setFinalChoice(null);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/scan", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to analyze");
      setResult(json.data as ScanResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    setFinalChoice(null);
  };

  const handleChoice = (choice: string) => {
    setFinalChoice(choice);
    gsap.fromTo(".choice-success",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    );
  };

  const handleProceed = async (scanAnother: boolean) => {
    if (!file || !result || !finalChoice) return;

    if (loading) return; // Prevent concurrent calls
    setLoading(true);

    try {
      const userStr = localStorage.getItem("user") || localStorage.getItem("partner_user");
      const user = userStr ? JSON.parse(userStr) : null;

      const fd = new FormData();
      fd.append("userId", user?.id || "");
      fd.append("userChoice", finalChoice);
      fd.append("aiRecommendation", result.recommendation);
      fd.append("image", file);

      const saveRes = await fetch("/api/scan/save", {
        method: "POST",
        body: fd
      });
      const saveData = await saveRes.json();

      if (!saveRes.ok) throw new Error(saveData.error || "Failed to save scan progress");

      // For Sell, Donate, Upcycle — we still use localStorage for the multi-item queue
      // but the scan is now also in the DB.
      if (finalChoice === "Sell" || finalChoice === "Donate" || finalChoice === "Upcycle" || finalChoice === "Recycle") {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64Image = reader.result;
          const itemData = {
            id: saveData.scanId || Date.now().toString(),
            image: base64Image,
            fileName: file.name,
            title: result.item,
            price: result.sellPrice,
            condition: result.condition,
            fabric: result.fabric,
            color: result.color
          };

          if (finalChoice === "Sell") {
            const existing = JSON.parse(localStorage.getItem("wearwise_sell_draft_list") || "[]");
            // Prevent adding same scan ID twice in local storage
            if (!existing.some((e: any) => e.id === itemData.id)) {
              existing.push(itemData);
              localStorage.setItem("wearwise_sell_draft_list", JSON.stringify(existing));
            }
            if (scanAnother) {
              setQueueCount(existing.length);
              reset();
              setLoading(false);
            } else {
              window.location.href = "/dashboard/my-market/new";
            }
          } else if (finalChoice === "Donate") {
            const existing = JSON.parse(localStorage.getItem("wearwise_donate_draft_list") || "[]");
            // Prevent adding same scan ID twice in local storage
            if (!existing.some((e: any) => e.id === itemData.id)) {
              existing.push(itemData);
              localStorage.setItem("wearwise_donate_draft_list", JSON.stringify(existing));
            }
            if (scanAnother) {
              setDonateQueueCount(existing.length);
              reset();
              setLoading(false);
            } else {
              window.location.href = "/dashboard/donate/new";
            }
          } else if (finalChoice === "Upcycle") {
            localStorage.setItem("wearwise_upcycle_item", JSON.stringify(itemData));
            window.location.href = "/dashboard/upcycle/new";
          } else if (finalChoice === "Recycle") {
            localStorage.setItem("wearwise_recycle_item", JSON.stringify(itemData));
            window.location.href = "/dashboard/recycle/new";
          }
        };
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  /* ─── render ─── */
  return (
    <div ref={containerRef} className="w-full">
      <main className="max-w-4xl mx-auto py-8">

        {/* ── Header ── */}
        <div className="scan-header text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-full px-4 py-2 text-xs font-semibold text-[#22c55e] mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            WearWise AI Scanner
          </span>
          <h1 className="font-display font-extrabold text-[clamp(2rem,5vw,3.2rem)] text-[#0f172a] leading-tight mb-3">
            Scan your garment,<br />
            <span style={{
              background: "linear-gradient(135deg, #22c55e 0%, #3b82f6 50%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>let AI assist.</span>
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-base">
            Upload a photo — our AI will analyze its condition, material, and recommend the best action instantly.
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
              className={`relative border-2 border-dashed rounded-2xl m-4 transition-all duration-300 ${preview ? "border-[#22c55e] bg-emerald-50/40" : "border-[#e2e8f0] hover:border-[#22c55e] hover:bg-emerald-50/20"
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
                    <p className="font-semibold text-[#0f172a] text-base mb-1">Drag & drop your clothing photo</p>
                    <p className="text-slate-400 text-sm">or click to browse files</p>
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
                    📁 Choose from Gallery
                  </button>
                  <button
                    onClick={openCamera}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#f8fafc] border-2 border-[#e2e8f0] text-slate-600 font-semibold py-3 rounded-2xl hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all"
                  >
                    📷 Use Camera
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={reset}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#f8fafc] border-2 border-[#e2e8f0] text-slate-600 font-semibold py-3 rounded-2xl hover:border-red-300 hover:text-red-500 transition-all"
                  >
                    🔄 Change Photo
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
                        Analyzing...
                      </>
                    ) : (
                      <>🤖 Analyze Now</>
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
                <p className="font-display font-bold text-[#0f172a] text-lg mb-1">AI is analyzing...</p>
                <p className="text-slate-400 text-sm">Evaluating material, condition, and value</p>
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
              <p className="font-semibold text-red-700 mb-1">An error occurred</p>
              <p className="text-red-600 text-sm">{error}</p>
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
                    {result.recommendationEmoji} AI Recommendation: {result.recommendation}
                  </div>

                  <h2 className="font-display font-extrabold text-2xl text-[#0f172a] mb-1">{result.item}</h2>
                  <p className="text-slate-500 text-sm mb-5">{result.color} · {result.fabric}</p>

                  {/* Condition bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Condition</span>
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

                </div>
              </div>
            </div>

            {/* ── Detail cards row ── */}
            <div className="result-stagger grid sm:grid-cols-2 gap-4">

              {/* Reasoning */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col h-full">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Why this?</p>
                <p className="text-[#0f172a] text-sm leading-relaxed flex-1">{result.reasoning}</p>
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
                      💰 Estimated Value
                    </p>
                    <p className="font-display font-extrabold text-xl text-[#0f172a]">{result.sellPrice}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Action paths (User Choice) ── */}
            <div className="result-stagger bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mt-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">What would you like to do?</h3>
                <p className="text-sm text-slate-500">The AI recommended <strong style={{ color: result.recommendationColor }}>{result.recommendation}</strong>, but the final choice is yours.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Sell", emoji: "🏷️", color: "#FF8C42", desc: "List in marketplace", pts: 50 },
                  { label: "Donate", emoji: "🤝", color: "#4DAAFF", desc: "Give to charity", pts: 30 },
                  { label: "Upcycle", emoji: "✂️", color: "#B06AFF", desc: "Repurpose fabric", pts: 20 },
                  { label: "Recycle", emoji: "♻️", color: "#2DCB73", desc: "Send to recycling", pts: 10 },
                ].map(({ label, emoji, color, desc, pts }, index, array) => {
                  const isRecommended = result.recommendation === label;
                  const isSelected = finalChoice === label || (!finalChoice && isRecommended);

                  // Determine if option is disabled based on hierarchy
                  const recIndex = array.findIndex(opt => opt.label === result.recommendation);
                  const isDisabled = index < recIndex;

                  return (
                    <button
                      key={label}
                      onClick={() => !isDisabled && handleChoice(label)}
                      disabled={isDisabled}
                      className={`group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all relative ${isDisabled ? "opacity-40 cursor-not-allowed bg-slate-50 grayscale" : "hover:-translate-y-1 cursor-pointer"
                        }`}
                      style={{
                        borderColor: isSelected ? color : "#e2e8f0",
                        background: isSelected ? `${color}08` : isDisabled ? undefined : "white",
                        boxShadow: isSelected ? `0 4px 12px ${color}22` : "none"
                      }}
                    >
                      {isRecommended && (
                        <div className="absolute -top-3 bg-white px-2 z-10">
                          <span className="text-[10px] font-extrabold tracking-wider uppercase rounded-full px-2.5 py-1 text-white shadow-sm" style={{ backgroundColor: color }}>
                            AI Pick
                          </span>
                        </div>
                      )}

                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: color }}>
                          ✓
                        </div>
                      )}

                      <span className={`text-3xl mb-2 ${!isDisabled && "group-hover:scale-110 transition-transform"}`}>{emoji}</span>
                      <span className="font-bold text-slate-800">{label}</span>
                      <span className="text-[10px] text-slate-500 text-center mt-1 leading-tight">{desc}</span>

                      {/* Points Reward Pill */}
                      <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${isDisabled ? "text-slate-400 bg-slate-200" : "text-amber-600 bg-amber-100"
                        }`}>
                        ⭐ +{pts} pts
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Success Message for User Choice */}
              {finalChoice && (
                <div className="choice-success relative overflow-hidden p-6 rounded-2xl border flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all"
                  style={{
                    backgroundColor: `${result.recommendationColor}10`,
                    borderColor: `${result.recommendationColor}30`,
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-2xl shrink-0">
                    {finalChoice === "Sell" ? "🏷️" : finalChoice === "Donate" ? "🤝" : finalChoice === "Upcycle" ? "✂️" : "♻️"}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-extrabold text-slate-800 text-lg mb-1">Great choice! 🎉</h4>
                    <p className="text-sm text-slate-600 mb-4">You selected to <strong className="text-slate-800">{finalChoice}</strong> this item. Let's take the next step to give this item a new purpose.</p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      {(finalChoice === "Sell" || finalChoice === "Donate") && (
                        <button
                          onClick={() => handleProceed(true)}
                          className="px-6 py-2.5 rounded-xl border-2 font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                          style={{
                            borderColor: finalChoice === "Sell" ? "#FF8C42" : "#4DAAFF",
                            color: finalChoice === "Sell" ? "#FF8C42" : "#4DAAFF",
                            backgroundColor: "transparent"
                          }}
                        >
                          ➕ Add & Scan Another
                        </button>
                      )}

                      <button
                        onClick={() => handleProceed(false)}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                        style={{
                          backgroundColor: finalChoice === "Sell" ? "#FF8C42" : finalChoice === "Donate" ? "#4DAAFF" : finalChoice === "Upcycle" ? "#B06AFF" : "#2DCB73"
                        }}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Proceed to {finalChoice}
                            {finalChoice === "Sell" ? ` (${queueCount + 1} ${queueCount + 1 === 1 ? 'item' : 'items'})` :
                              finalChoice === "Donate" ? ` (${donateQueueCount + 1} ${donateQueueCount + 1 === 1 ? 'item' : 'items'})` :
                                ""}
                            <span className="text-lg">→</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Queue management help */}
                    {((finalChoice === "Sell" && queueCount > 0) || (finalChoice === "Donate" && donateQueueCount > 0)) && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-medium italic">
                          * You have {finalChoice === "Sell" ? queueCount : donateQueueCount} other items waiting in your {finalChoice.toLowerCase()} list.
                        </p>
                        <button
                          onClick={() => {
                            if (finalChoice === "Sell") {
                              localStorage.removeItem("wearwise_sell_draft_list");
                              setQueueCount(0);
                            } else {
                              localStorage.removeItem("wearwise_donate_draft_list");
                              setDonateQueueCount(0);
                            }
                          }}
                          className="text-[10px] font-bold text-red-400 hover:text-red-500 underline"
                        >
                          Clear List
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Scan again ── */}
            <div className="flex justify-center pt-2">
              <button
                onClick={reset}
                className="flex items-center gap-2 text-slate-500 hover:text-[#22c55e] font-semibold text-sm transition-colors"
              >
                🔄 Scan another item
              </button>
            </div>
          </div>
        )}

        {/* ── Tips row ── */}
        {!result && !loading && (
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { icon: "💡", title: "Good Lighting", desc: "Take a photo with sufficient lighting, plain backgrounds are better." },
              { icon: "🎯", title: "Show Entire Item", desc: "Make sure the clothing is visible entirely from top to bottom." },
              { icon: "⚡", title: "Instant Analysis", desc: "Get comprehensive results in seconds using Gemini AI." },
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
