"use client";

import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma"; // This won't work in client component, need to fetch from API
import Link from "next/link";
import { Plus, Tag, MapPin, Star, Clock, CheckCircle, Package, Scissors } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function MyWardrobePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "sell" | "donate" | "service" | "history">("all");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const parsedUser = userStr ? JSON.parse(userStr) : null;
      setUser(parsedUser);
      
      const url = parsedUser?.id ? `/api/items?userId=${parsedUser.id}` : "/api/items";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (e) {
      console.error("Failed to fetch items:", e);
    }
    setLoading(false);
  };

  const sellItems = items.filter(i => i.status === "available" && i.userId === user?.id);
  const donateItems = items.filter(i => i.status.includes("donated") && i.userId === user?.id);
  const serviceItems = items.filter(i => (i.status.includes("upcycling") || i.status.includes("recycling")) && i.userId === user?.id);
  const historyItems = items.filter(i => 
    (["sold", "pending", "donated", "upcycled", "recycled"].includes(i.status) && i.userId === user?.id) || 
    (user?.id && i.userId !== user?.id)
  );

  const getDisplayItems = () => {
    switch(activeTab) {
      case "sell": return sellItems;
      case "donate": return donateItems;
      case "service": return serviceItems;
      case "history": return historyItems;
      default: return items;
    }
  };

  const displayItems = getDisplayItems();

  const getStatusBadge = (item: any) => {
    const isBuyer = user?.id && item.userId !== user?.id;
    if (isBuyer && item.status === "sold") return { label: "Berhasil Dibeli", color: "bg-blue-600 text-white border-transparent" };
    if (isBuyer && item.status === "pending") return { label: "Menunggu Konfirmasi Kamu", color: "bg-amber-50 text-amber-600 border-amber-100" };
    if (item.status === "available") return { label: "Di Pasar", color: "bg-green-50 text-green-600 border-green-100" };
    if (item.status.includes("upcycling")) return { label: "Upcycling", color: "bg-purple-50 text-purple-600 border-purple-100" };
    if (item.status.includes("recycling")) return { label: "Recycling", color: "bg-blue-50 text-blue-600 border-blue-100" };
    if (item.status === "sold") return { label: "Terjual", color: "bg-slate-900 text-white border-transparent" };
    if (item.status === "pending") return { label: "Menunggu", color: "bg-amber-50 text-amber-600 border-amber-100" };
    return { label: item.status, color: "bg-slate-100 text-slate-500 border-slate-200" };
  };

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2 tracking-tight">My Wardrobe</h1>
          <p className="text-slate-500 font-medium">Koleksi barang pribadimu yang sudah di-scan & diproses.</p>
        </div>
        <Link 
          href="/dashboard/scan" 
          className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-[20px] font-bold shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95 w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Scan Barang Baru
        </Link>
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        {[
          { id: "all", label: "Semua", icon: Package, count: items.length },
          { id: "sell", label: "Marketplace", icon: Tag, count: sellItems.length },
          { id: "donate", label: "Donasi", icon: Package, count: donateItems.length },
          { id: "service", label: "Upcycle/Recycle", icon: Scissors, count: serviceItems.length },
          { id: "history", label: "Riwayat", icon: Clock, count: historyItems.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
              activeTab === tab.id 
                ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200" 
                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-6" />
          <p className="text-slate-500 font-bold text-lg">Membuka lemari pakaianmu...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="bg-white border-2 border-slate-100 border-dashed rounded-[40px] p-24 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
            <Package size={48} className="text-slate-200" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">Belum Ada Barang di Kategori Ini</h3>
          <p className="text-slate-500 max-w-sm mb-10 leading-relaxed font-medium">
            Mulai kelola pakaian lamamu dengan men-scan-nya menggunakan AI WearWise.
          </p>
          <Link 
            href="/dashboard/scan" 
            className="bg-green-500 text-white px-10 py-4 rounded-2xl font-extrabold hover:bg-green-600 transition-all shadow-xl shadow-green-100"
          >
            Scan Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayItems.map((item) => {
            const badge = getStatusBadge(item);
            return (
              <Link href={`/dashboard/my-market/${item.id}`} key={item.id}>
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all group h-full flex flex-col hover:-translate-y-3">
                  <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    
                    {/* Status Badge Overlay */}
                    <div className="absolute top-5 left-5">
                      <div className={`px-4 py-2 rounded-2xl font-extrabold text-[10px] uppercase tracking-widest shadow-lg border backdrop-blur-md ${badge.color}`}>
                        {badge.label}
                      </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Harga/Estimasi</span>
                          <span className="text-sm font-extrabold text-slate-900">Rp {item.price.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="p-2 bg-green-500 text-white rounded-xl">
                          <CheckCircle size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-2 mb-4 group-hover:text-green-600 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    
                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                          <MapPin size={14} className="text-slate-400" />
                        </div>
                        <span className="text-xs font-bold truncate max-w-[100px]">
                          {item.user?.address?.split(',')[0] || "Alamat..."}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl">
                        <div className={`w-2 h-2 rounded-full ${item.status === "available" ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Info</span>
                      </div>
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
