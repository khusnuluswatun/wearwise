"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartHandshake,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ArrowRight,
  TrendingUp,
  Scissors,
  Recycle
} from "lucide-react";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [partnerUser, setPartnerUser] = useState<any>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, rejected: 0, total: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user") || localStorage.getItem("partner_user");
    if (!userStr) { router.replace("/login"); return; }
    const user = JSON.parse(userStr);
    setPartnerUser(user);

    if (user.partner) {
      setPartnerInfo(user.partner);
    }

    // Fetch partner statistics and profile
    fetch(`/api/partner/stats?userId=${user.id}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          setPartnerInfo(result.data.partnerInfo);
          setStats(result.data.stats);
          setRecent(result.data.recentActivity);
          
          // Sync to localStorage
          const updatedUser = { ...user, partner: result.data.partnerInfo };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending:   { label: "Menunggu", color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",   icon: Clock },
    confirmed: { label: "Diterima",  color: "text-green-600",  bg: "bg-green-50 border-green-200",   icon: CheckCircle2 },
    rejected:  { label: "Ditolak",   color: "text-red-600",    bg: "bg-red-50 border-red-200",       icon: XCircle },
  };

  const isService = partnerInfo?.type === "upcycle" || partnerInfo?.type === "umkm" || partnerInfo?.type === "recycle";
  const isRecycle = partnerInfo?.type === "recycle";
  const isUpcycle = partnerInfo?.type === "upcycle" || partnerInfo?.type === "umkm";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Memuat dashboard...</p>
      </div>
    </div>
  );
 
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
 
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-800">
            Selamat datang 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {partnerInfo?.name || "Partner"} · Dashboard {isUpcycle ? "Upcycle" : isRecycle ? "Recycle" : "Donasi"}
          </p>
        </div>
        <Link
          href={isService ? "/partner/dashboard/upcycles" : "/partner/dashboard/donations"}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/25 hover:scale-105 transition-all text-sm"
        >
          Lihat Semua {isUpcycle ? "Upcycle" : isRecycle ? "Recycle" : "Donasi"} <ArrowRight size={16} />
        </Link>
      </div>
 
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isUpcycle ? "Total Upcycle" : isRecycle ? "Total Recycle" : "Total Donasi", value: stats.total,     icon: Package,       from: "from-slate-500",   to: "to-slate-600" },
          { label: "Menunggu",     value: stats.pending,   icon: Clock,         from: "from-amber-400",   to: "to-amber-500" },
          { label: "Diterima",     value: stats.confirmed, icon: CheckCircle2,  from: "from-green-500",   to: "to-emerald-600" },
          { label: "Ditolak",      value: stats.rejected,  icon: XCircle,       from: "from-red-400",     to: "to-red-500" },
        ].map(({ label, value, icon: Icon, from, to }) => (
          <div key={label} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${from} ${to} flex items-center justify-center mb-4 shadow-lg`}>
              <Icon size={22} className="text-white" />
            </div>
            <p className="text-3xl font-display font-extrabold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>
 
      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-green-500" />
            <h2 className="font-bold text-slate-800">Tingkat Penerimaan</h2>
            <span className="ml-auto text-2xl font-extrabold text-emerald-600">
              {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000"
              style={{ width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
            <span>{stats.confirmed} diterima</span>
            <span>{stats.total} total</span>
          </div>
        </div>
      )}
 
      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            {isUpcycle ? <Scissors size={18} className="text-purple-500" /> : isRecycle ? <Recycle size={18} className="text-emerald-500" /> : <HeartHandshake size={18} className="text-green-500" />} 
            {isUpcycle ? "Upcycle Terbaru" : isRecycle ? "Recycle Terbaru" : "Donasi Terbaru"}
          </h2>
          <Link href={isService ? "/partner/dashboard/upcycles" : "/partner/dashboard/donations"} className="text-xs font-bold text-green-600 hover:underline">
            Lihat semua →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <HeartHandshake size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Belum ada donasi masuk</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map((tx: any) => {
              const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                    {tx.user?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{tx.name}</p>
                    <p className="text-xs text-slate-400 truncate">dari {tx.user}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                    <Icon size={11} /> {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
