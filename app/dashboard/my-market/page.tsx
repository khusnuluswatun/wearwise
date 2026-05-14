"use client";

import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma"; // This won't work in client component, need to fetch from API
import Link from "next/link";
import { Plus, Tag, MapPin, Star, Clock, CheckCircle, Package } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function SellMarketPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      const url = user?.id ? `/api/items?userId=${user.id}` : "/api/items";
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

  const activeItems = items.filter((item: any) => item.status === "available");
  const historyItems = items.filter((item: any) => item.status === "sold" || item.status === "pending");

  const displayItems = activeTab === "active" ? activeItems : historyItems;

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-800 mb-2">My Marketplace</h1>
          <p className="text-slate-500">Kelola barang daganganmu dan pantau riwayat penjualan.</p>
        </div>
        <Link 
          href="/dashboard/scan" 
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-green-500/30 transition-all hover:-translate-y-1 active:scale-95 w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Jual Barang Baru
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "active" 
              ? "bg-white text-green-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Package size={18} />
          Barang Aktif ({activeItems.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "history" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Clock size={18} />
          Riwayat Jual ({historyItems.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Memuat koleksi barangmu...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="bg-white border-2 border-slate-100 border-dashed rounded-[40px] p-20 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            {activeTab === "active" ? (
              <Tag size={40} className="text-slate-300" />
            ) : (
              <Clock size={40} className="text-slate-300" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            {activeTab === "active" ? "Belum Ada Barang Aktif" : "Belum Ada Riwayat"}
          </h3>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            {activeTab === "active" 
              ? "Kamu sedang tidak menjual apapun saat ini. Yuk scan pakaian lamamu!" 
              : "Belum ada transaksi penjualan yang selesai atau sedang diproses."}
          </p>
          {activeTab === "active" && (
            <Link 
              href="/dashboard/scan" 
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              Scan Sekarang
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayItems.map((item: any) => (
            <Link href={`/dashboard/my-market/${item.id}`} key={item.id}>
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group h-full flex flex-col hover:-translate-y-2">
                <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Status Overlay for History */}
                  {item.status !== "available" && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                      <div className={`px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-widest shadow-lg ${
                        item.status === "sold" ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                      }`}>
                        {item.status === "sold" ? "Terjual ✨" : "Pending ⏳"}
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-white/50 flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-slate-700">Mulus</span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">{item.title}</h3>
                  <p className="text-xl font-display font-extrabold text-slate-900 mb-4">
                    Rp {item.price.toLocaleString("id-ID")}
                  </p>
                  
                  <div className="pt-5 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="p-1.5 bg-slate-100 rounded-lg">
                        <MapPin size={12} className="text-slate-400" />
                      </div>
                      <span className="text-xs font-bold truncate max-w-[100px]">
                        {item.user?.address?.split(',')[0] || "Alamat..."}
                      </span>
                    </div>
                    
                    {item.status === "available" ? (
                      <div className="flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase tracking-wider bg-green-50 px-2 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Aktif
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-lg">
                        History
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
