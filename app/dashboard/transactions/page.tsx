"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Tag,
  Clock,
  CheckCircle,
  Scissors,
  Recycle,
  XCircle,
  ShoppingBag,
  Heart,
  Loader2,
  MapPin,
  ArrowRight
} from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "buy" | "sell" | "donate" | "upcycle" | "recycle">("all");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const parsedUser = userStr ? JSON.parse(userStr) : null;
      setUser(parsedUser);

      if (parsedUser?.id) {
        const res = await fetch(`/api/transactions?userId=${parsedUser.id}`);
        const data = await res.json();
        if (data.success) {
          setTransactions(data.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    }
    setLoading(false);
  };

  const getFilteredTransactions = () => {
    if (activeTab === "all") return transactions;
    return transactions.filter(tx => tx.type === activeTab);
  };

  const filtered = getFilteredTransactions();

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "success" || s === "completed" || s === "verified") return "bg-green-50 text-green-600 border-green-100";
    if (s === "rejected") return "bg-red-50 text-red-600 border-red-100";
    if (s === "pending" || s === "pending_verification") return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-blue-50 text-blue-600 border-blue-100";
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "buy": return { label: "Pembelian", icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" };
      case "sell": return { label: "Penjualan", icon: Tag, color: "text-orange-500", bg: "bg-orange-50" };
      case "donate": return { label: "Donasi", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" };
      case "upcycle": return { label: "Upcycle", icon: Scissors, color: "text-purple-500", bg: "bg-purple-50" };
      case "recycle": return { label: "Recycle", icon: Recycle, color: "text-emerald-500", bg: "bg-emerald-50" };
      default: return { label: type, icon: Package, color: "text-slate-500", bg: "bg-slate-50" };
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-700 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-slate-500 font-medium">Pantau semua aktivitas fashion circular kamu di sini.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: "all", label: "Semua", icon: Package, count: transactions.length },
          { id: "buy", label: "Pembelian", icon: ShoppingBag, count: transactions.filter(t => t.type === "buy").length },
          { id: "sell", label: "Penjualan", icon: Tag, count: transactions.filter(t => t.type === "sell").length },
          { id: "donate", label: "Donasi", icon: Heart, count: transactions.filter(t => t.type === "donate").length },
          { id: "upcycle", label: "Upcycle", icon: Scissors, count: transactions.filter(t => t.type === "upcycle").length },
          { id: "recycle", label: "Recycle", icon: Recycle, count: transactions.filter(t => t.type === "recycle").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-xs whitespace-nowrap transition-all border-2 shrink-0 relative ${activeTab === tab.id
                ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200"
                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50 shadow-sm"
              }`}
          >
            <tab.icon size={16} strokeWidth={2.5} />
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100">
          <Loader2 className="w-12 h-12 text-slate-400 animate-spin mb-6" />
          <p className="text-slate-500 font-bold text-lg">Membuka catatan transaksi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-slate-100 border-dashed rounded-[40px] p-24 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
            <Clock size={48} className="text-slate-200" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">Belum Ada Transaksi</h3>
          <p className="text-slate-500 max-w-sm mb-10 leading-relaxed font-medium">
            Mulai beraksi! Donasi, jual, atau olah pakaianmu untuk melihat riwayat di sini.
          </p>
          <Link
            href="/dashboard/market"
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-extrabold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Cari Barang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((tx) => {
            const typeInfo = getTypeBadge(tx.type);
            const statusStyle = getStatusStyle(tx.status);

            return (
              <Link href={tx.link} key={tx.id}>
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative hover:-translate-y-2">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                      {tx.imageUrl ? (
                        <img src={tx.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200 text-2xl">
                          {tx.type === "upcycle" ? "🧵" : tx.type === "donate" ? "🤝" : "📦"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest mb-1.5 ${typeInfo.bg} ${typeInfo.color}`}>
                        <typeInfo.icon size={10} /> {typeInfo.label}
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 truncate group-hover:text-slate-900">
                        {tx.itemName}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{tx.id.substring(0, 8)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg mt-1 border ${statusStyle}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nilai</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-1">
                          {tx.price ? `Rp ${tx.price.toLocaleString()}` : "Gratis / Donasi"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                          🏢
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Partner/Tujuan</span>
                          <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">{tx.partnerName}</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <div className="p-2 bg-slate-900 text-white rounded-full shadow-lg">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
