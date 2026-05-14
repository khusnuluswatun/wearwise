"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  Package,
  Filter,
  Loader2,
  DollarSign,
  Calendar,
  AlertCircle,
  MessageCircle
} from "lucide-react";

type Status = "all" | "pending" | "confirmed" | "completed" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:   { label: "Menunggu", color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", icon: Clock },
  confirmed: { label: "Diproses",   color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",  icon: Scissors },
  completed: { label: "Selesai",    color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200", icon: CheckCircle2 },
  rejected:  { label: "Ditolak",    color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   icon: XCircle },
};

export default function PartnerUpcyclesPage() {
  const router = useRouter();
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [partnerUser, setPartnerUser] = useState<any>(null);
  const [upcycles, setUpcycles] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  
  // UMKM Inputs
  const [priceInput, setPriceInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user") || localStorage.getItem("partner_user");
    if (!userStr) { router.replace("/login"); return; }
    const user = JSON.parse(userStr);
    setPartnerUser(user);

    fetch(`/api/partners?userId=${user.id}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.success || !d.data?.length) { setLoading(false); return; }
        const partner = d.data[0];
        setPartnerInfo(partner);

        const res = await fetch(`/api/upcycles?partnerId=${partner.id}`);
        const data = await res.json();
        if (data.success) {
          setUpcycles(data.data);
          setFiltered(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFiltered(upcycles);
    } else {
      setFiltered(upcycles.filter((d: any) => d.status === statusFilter));
    }
  }, [statusFilter, upcycles]);

  const handleAction = async (txId: string, newStatus: string) => {
    if (!partnerInfo) return;
    
    const isRecycleTx = isRecycle;
    
    if (newStatus === "confirmed") {
      if (!isRecycleTx) {
        if (!priceInput) {
          alert("Harap isi penawaran harga");
          return;
        }
        if (!deadlineInput) {
          alert("Harap isi estimasi selesai");
          return;
        }
      }
    }

    setActionLoading(txId + newStatus);
    setError(null);
    try {
      const res = await fetch(`/api/donations/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus, 
          partnerId: partnerInfo.id,
          price: priceInput,
          endDate: deadlineInput
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update status");

      // Update local state
      setUpcycles((prev) =>
        prev.map((d: any) => (d.id === txId ? { ...d, status: newStatus, price: priceInput ? parseInt(priceInput) : d.price, endDate: deadlineInput ? new Date(deadlineInput) : d.endDate } : d))
      );
      setSelectedTx(null);
      setPriceInput("");
      setDeadlineInput("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const isDeadlineNear = (endDateStr: string) => {
    if (!endDateStr) return false;
    const deadline = new Date(endDateStr);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const daysLeft = diff / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 2; // Warning if 2 days or less
  };

  const handleContactWA = (user: any) => {
    if (!user.phone) return;
    const phone = user.phone.replace(/[^0-9]/g, "");
    const formattedPhone = phone.startsWith("0") ? "62" + phone.substring(1) : phone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent("Halo, ini dari UMKM WearWise...")}`;
    window.open(url, "_blank");
  };

  const isRecycle = partnerInfo?.type === "recycle";
  const pageTitle = isRecycle ? "Daftar Permintaan Recycle" : "Daftar Permintaan Upcycle";
  const itemLabel = isRecycle ? "Recycle" : "Upcycle";

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-green-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-slate-800 flex items-center gap-3">
            {isRecycle ? <Package className="text-emerald-500" /> : <Scissors className="text-purple-500" />} {pageTitle}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Kelola semua pesanan {itemLabel.toLowerCase()} masuk dari user.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "completed", "rejected"] as Status[]).map((s) => {
          const cfg = s === "all" ? null : STATUS_CONFIG[s];
          const isActive = statusFilter === s;
          const count = s === "all" ? upcycles.length : upcycles.filter((u: any) => u.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                isActive
                  ? s === "all" ? "bg-slate-800 text-white border-slate-800 shadow-md" : `${cfg?.bg} ${cfg?.color} ${cfg?.border} shadow-sm`
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cfg ? <cfg.icon size={12} /> : <Filter size={12} />}
              {s === "all" ? "Semua" : cfg?.label}
              <span className={`px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/30" : "bg-slate-100"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-200">
          <Package size={48} className="text-slate-200 mb-4" />
          <p className="text-lg font-bold text-slate-600">Tidak ada pesanan</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((tx: any) => {
            const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const warning = isDeadlineNear(tx.endDate);

            return (
              <div 
                key={tx.id}
                onClick={() => { setSelectedTx(tx); setPriceInput(tx.price?.toString() || ""); setDeadlineInput(tx.endDate ? new Date(tx.endDate).toISOString().split('T')[0] : ""); }}
                className={`group bg-white rounded-3xl border-2 p-5 shadow-sm transition-all cursor-pointer hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 ${warning && tx.status === "confirmed" ? "border-red-200 bg-red-50/10" : "border-slate-100"}`}
              >
                <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
                  {/* Photo */}
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                    {tx.imageUrl ? (
                      <img src={tx.imageUrl} alt="item" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="text-slate-300" /></div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-purple-600 transition-colors">{tx.item?.title || "Item Upcycle"}</h3>
                        <p className="text-xs text-slate-500">dari {tx.user?.name || "Pelanggan"}</p>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold self-center md:self-start ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <StatusIcon size={12} /> {cfg.label}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      {tx.price && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <DollarSign size={14} className="text-green-500" /> Rp {tx.price.toLocaleString()}
                        </div>
                      )}
                      {tx.endDate && (
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${warning ? "text-red-600 animate-pulse" : "text-slate-700"}`}>
                          <Calendar size={14} className={warning ? "text-red-500" : "text-blue-500"} /> 
                          {new Date(tx.endDate).toLocaleDateString()} {warning && "(Tenggat Dekat!)"}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button 
                      onClick={(e) => { e.stopPropagation(); handleContactWA(tx.user); }}
                      className="p-3 bg-green-100 text-green-600 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                     >
                        <MessageCircle size={18} fill="currentColor" />
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail & Action Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {selectedTx.imageUrl && <img src={selectedTx.imageUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-800">{selectedTx.item?.title}</h3>
                      <p className="text-sm text-slate-500">Pelanggan: {selectedTx.user?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTx(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">✕</button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Permintaan Item</p>
                    <p className="text-sm text-slate-700 leading-relaxed italic">"{selectedTx.item?.description || 'Tidak ada deskripsi'}"</p>
                  </div>
                  {selectedTx.notes && (
                    <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Catatan Tambahan</p>
                      <p className="text-sm text-purple-700 leading-relaxed">"{selectedTx.notes}"</p>
                    </div>
                  )}
                </div>

                {selectedTx.status === "pending" ? (
                  <div className="space-y-4">
                    {!isRecycle ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 ml-1">Tawarkan Harga (Rp)</label>
                          <div className="relative">
                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                             <input 
                              type="number" 
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              placeholder="Contoh: 150000"
                              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all" 
                             />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 ml-1">Estimasi Selesai</label>
                          <input 
                            type="date" 
                            value={deadlineInput}
                            onChange={(e) => setDeadlineInput(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-sm text-emerald-700 font-bold">Konfirmasi penerimaan barang untuk diproses daur ulang.</p>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => handleAction(selectedTx.id, "rejected")}
                        className="flex-1 py-4 rounded-2xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-all"
                      >
                        Tolak
                      </button>
                      <button 
                        disabled={!!actionLoading}
                        onClick={() => handleAction(selectedTx.id, "confirmed")}
                        className={`flex-[2] py-4 px-8 rounded-2xl text-white font-extrabold shadow-lg transition-all hover:-translate-y-1 ${isRecycle ? "bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700" : "bg-purple-600 shadow-purple-500/20 hover:bg-purple-700"}`}
                      >
                        {actionLoading?.includes("confirmed") ? <Loader2 className="animate-spin mx-auto" /> : (isRecycle ? "Terima Permintaan" : "Terima & Beri Penawaran")}
                      </button>
                    </div>
                  </div>
                ) : selectedTx.status === "confirmed" ? (
                  <div className="space-y-6">
                    {!isRecycle && (
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Penawaran Aktif</p>
                           <p className="font-bold text-blue-800">Rp {selectedTx.price?.toLocaleString()} · Selesai {selectedTx.endDate ? new Date(selectedTx.endDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        {selectedTx.endDate && isDeadlineNear(selectedTx.endDate) && (
                          <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-100 px-3 py-1 rounded-full animate-pulse">
                             <AlertCircle size={14} /> Deadline Dekat!
                          </div>
                        )}
                      </div>
                    )}

                    {isRecycle && (
                      <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center">
                        <Package size={40} className="text-emerald-500 mx-auto mb-3 opacity-50" />
                        <p className="text-emerald-800 font-bold">Barang sedang dalam proses pengolahan daur ulang.</p>
                      </div>
                    )}

                    <button 
                      onClick={() => handleAction(selectedTx.id, "completed")}
                      className={`w-full py-4 rounded-2xl text-white font-extrabold text-lg shadow-lg transition-all hover:-translate-y-1 ${isRecycle ? "bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700" : "bg-green-500 shadow-green-500/20 hover:bg-green-600"}`}
                    >
                      {isRecycle ? "✅ Konfirmasi Selesai" : "✅ Tandai Selesai & Kirim Tagihan"}
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-3xl">
                     <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
                     <p className="font-bold text-slate-800">Pesanan ini sudah {STATUS_CONFIG[selectedTx.status]?.label}</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
