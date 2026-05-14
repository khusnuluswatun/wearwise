"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  Package,
  Filter,
  Loader2,
} from "lucide-react";

type Status = "all" | "pending" | "confirmed" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:   { label: "Menunggu Konfirmasi", color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", icon: Clock },
  confirmed: { label: "Diterima",            color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200", icon: CheckCircle2 },
  rejected:  { label: "Ditolak",             color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   icon: XCircle },
};

export default function PartnerDonationsPage() {
  const router = useRouter();
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [partnerUser, setPartnerUser] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedTx, setSelectedTx] = useState<any | null>(null);

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

        const res = await fetch(`/api/donations?partnerId=${partner.id}`);
        const data = await res.json();
        if (data.success) {
          setDonations(data.data);
          setFiltered(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFiltered(donations);
    } else {
      setFiltered(donations.filter((d: any) => d.status === statusFilter));
    }
  }, [statusFilter, donations]);

  const handleAction = async (txId: string, newStatus: "confirmed" | "rejected") => {
    if (!partnerInfo) return;
    setActionLoading(txId + newStatus);
    setError(null);
    try {
      const res = await fetch(`/api/donations/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, partnerId: partnerInfo.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update status");

      // Update local state
      setDonations((prev) =>
        prev.map((d: any) => (d.id === txId ? { ...d, status: newStatus } : d))
      );
      setSelectedTx(null); // Close modal on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    all:       donations.length,
    pending:   donations.filter((d: any) => d.status === "pending").length,
    confirmed: donations.filter((d: any) => d.status === "confirmed").length,
    rejected:  donations.filter((d: any) => d.status === "rejected").length,
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Memuat data donasi...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-extrabold text-slate-800">Donasi Masuk</h1>
        <p className="text-slate-500 mt-1">Kelola dan konfirmasi barang donasi yang masuk ke {partnerInfo?.name || "tempat donasi"} kamu.</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "rejected"] as Status[]).map((s) => {
          const cfg = s === "all" ? null : STATUS_CONFIG[s];
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                isActive
                  ? s === "all"
                    ? "bg-slate-800 text-white border-slate-800 shadow-lg"
                    : `${cfg?.bg} ${cfg?.color} ${cfg?.border} shadow-sm`
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cfg ? <cfg.icon size={14} /> : <Filter size={14} />}
              {s === "all" ? "Semua" : cfg?.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/30" : "bg-slate-100"}`}>
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Donation list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
          <HeartHandshake size={48} className="text-slate-200 mb-4" />
          <p className="text-lg font-bold text-slate-600">Tidak ada donasi</p>
          <p className="text-slate-400 text-sm mt-1">
            {statusFilter === "all" ? "Belum ada donasi yang masuk." : `Tidak ada donasi dengan status "${STATUS_CONFIG[statusFilter]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((tx: any) => {
            const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;

            return (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all cursor-pointer hover:border-blue-300 hover:shadow-md ${tx.status === "pending" ? "border-amber-200" : "border-slate-200"}`}
              >
                <div className="flex items-center">

                  {/* Image */}
                  <div className="w-24 h-24 shrink-0 bg-slate-50 flex items-center justify-center p-2">
                    {tx.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tx.imageUrl}
                        alt={tx.item?.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package size={20} className="text-slate-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm truncate">{tx.item?.title || "Barang Donasi"}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">dari {tx.user?.name || "Donor"}</p>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <StatusIcon size={10} /> {cfg.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Detail Donasi</h2>
              <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <XCircle size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Item Photo & Title */}
              <div className="flex gap-4">
                <div className="w-24 h-32 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                  {selectedTx.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedTx.imageUrl} alt={selectedTx.item?.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={32} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">{selectedTx.item?.title || "Barang Donasi"}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold mt-2 ${STATUS_CONFIG[selectedTx.status]?.bg} ${STATUS_CONFIG[selectedTx.status]?.color} ${STATUS_CONFIG[selectedTx.status]?.border}`}>
                    {selectedTx.status === "pending" ? <Clock size={10} /> : selectedTx.status === "confirmed" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    {STATUS_CONFIG[selectedTx.status]?.label}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wider">ID: {selectedTx.id}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deskripsi Barang</p>
                <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 border border-slate-100 leading-relaxed">
                  {selectedTx.item?.description || "Tidak ada deskripsi."}
                </div>
              </div>

              {/* Logistics Info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode Pengiriman</p>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    selectedTx.deliveryMethod === "pickup" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {selectedTx.deliveryMethod === "pickup" ? "🚚 Pickup" : "🏢 Drop Off"}
                  </div>
                </div>

                {selectedTx.deliveryMethod === "pickup" && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waktu Penjemputan</p>
                      <p className="text-sm font-bold text-slate-700">{selectedTx.pickupTime ? new Date(selectedTx.pickupTime).toLocaleString("id-ID") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat Penjemputan</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedTx.pickupAddress || selectedTx.user?.address || "—"}</p>
                    </div>
                  </div>
                )}
                
                {selectedTx.deliveryMethod === "drop_off" && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[10px] text-slate-500 italic">Donor akan mengantarkan barang langsung ke lokasi Anda.</p>
                  </div>
                )}
              </div>

              {/* Donor Info */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendonor</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <User size={14} className="text-green-500" /> {selectedTx.user?.name || "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontak</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Phone size={14} className="text-green-500" /> {selectedTx.user?.phone || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Actions) */}
            {selectedTx.status === "pending" && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => handleAction(selectedTx.id, "rejected")}
                  disabled={!!actionLoading}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === selectedTx.id + "rejected" ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Tolak Donasi"}
                </button>
                <button
                  onClick={() => handleAction(selectedTx.id, "confirmed")}
                  disabled={!!actionLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === selectedTx.id + "confirmed" ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Konfirmasi Terima"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
