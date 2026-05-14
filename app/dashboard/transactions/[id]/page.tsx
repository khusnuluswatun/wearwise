"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, MapPin, Phone, MessageCircle, Scissors, HeartHandshake, CheckCircle2, Calendar, CreditCard, DollarSign } from "lucide-react";
import Link from "next/link";

export default function TransactionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setData(result.data);
        else setError(result.error);
        setLoading(false);
      })
      .catch(err => {
        setError("Gagal memuat detail transaksi");
        setLoading(false);
      });
  }, [id]);

  const handleConfirmSuccess = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "success", role: "user" })
      });
      const result = await res.json();
      if (result.success) {
        setData({ ...data, status: "Success" });
        router.refresh();
      } else {
        alert(result.error || "Gagal konfirmasi");
      }
    } catch (err) {
      alert("Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleContactWA = () => {
    const phone = data?.partner?.phone?.replace(/[^0-9]/g, "");
    if (!phone) return;
    const formattedPhone = phone.startsWith("0") ? "62" + phone.substring(1) : phone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Halo ${data.partner.name}, saya ingin bertanya mengenai pesanan ${data.type} #${id.toString().substring(0, 6)}`)}`;
    window.open(url, "_blank");
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto mb-4" /> Memuat detail...</div>;
  if (error || !data) return <div className="p-20 text-center text-red-500">Error: {error || "Data tidak ditemukan"}</div>;

  const isUpcycle = data.type === "upcycle";
  const status = data.status.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6 pt-4">
        <button onClick={() => router.push("/dashboard")} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </button>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isUpcycle ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-600"
        }`}>
          {data.type} #{id.toString().substring(0, 6)}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden mb-6">
        {/* Header Status */}
        <div className={`p-8 text-center ${
          status === "success" || status === "completed" ? "bg-green-50" : status === "pending" ? "bg-amber-50" : "bg-blue-50"
        }`}>
          <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-3xl">
            {status === "success" || status === "completed" ? "✅" : isUpcycle ? "✂️" : "🤝"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1 capitalize">{data.status}</h1>
          <p className="text-xs text-slate-500 font-medium">Transaksi dibuat pada {new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Item Info */}
          <div className="flex gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
              {data.imageUrl ? <img src={data.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-6 text-slate-200" />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-extrabold text-slate-800 mb-1">{data.item?.title || "Garment Item"}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{data.item?.description || "No description provided."}</p>
            </div>
          </div>

          <hr className="border-slate-50" />

          {/* Collaborative Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode Logistik</p>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                {data.deliveryMethod === "pickup" ? "🚚 Penjemputan" : "🏢 Antar Sendiri"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode Pembayaran</p>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CreditCard size={14} className="text-blue-500" /> {data.paymentMethod || "Belum ditentukan"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harga / Biaya</p>
              <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                <DollarSign size={14} /> {data.price ? `Rp ${data.price.toLocaleString()}` : "Menunggu kesepakatan"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimasi Selesai</p>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar size={14} className="text-purple-500" /> {data.endDate ? new Date(data.endDate).toLocaleDateString('id-ID') : "Menunggu konfirmasi"}
              </p>
            </div>
          </div>

          {/* Partner Info */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl">
                {isUpcycle ? "🧵" : "🏪"}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner / UMKM</p>
                <p className="font-bold text-slate-800">{data.partner?.name}</p>
              </div>
            </div>
            <button 
              onClick={handleContactWA}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
            >
              <MessageCircle size={18} fill="currentColor" /> Chat via WhatsApp
            </button>
          </div>

          {/* Action Buttons */}
          {status !== "success" && status !== "completed" && status !== "rejected" && (
            <div className="pt-4">
              <button 
                onClick={handleConfirmSuccess}
                disabled={actionLoading}
                className="w-full py-5 rounded-3xl bg-slate-800 text-white font-extrabold text-lg shadow-xl shadow-slate-800/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <CheckCircle2 /> Selesaikan Transaksi & Ambil Reward
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-4 px-10">
                Pastikan barang sudah diterima atau proses upcycle sudah benar-benar selesai sebelum melakukan konfirmasi.
              </p>
            </div>
          )}

          {(status === "success" || status === "completed") && (
            <div className="p-6 rounded-3xl bg-green-50 border border-green-100 text-center">
              <p className="text-green-700 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={20} /> Transaksi Selesai! Reward sudah ditambahkan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Tips */}
      <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex gap-4">
        <div className="text-2xl text-blue-500 shrink-0">💡</div>
        <div className="text-xs text-blue-700 leading-relaxed">
          <strong>Tips:</strong> Diskusikan detail desain atau revisi pengerjaan melalui WhatsApp. Jangan lupa kirimkan bukti pembayaran jika menggunakan metode Transfer.
        </div>
      </div>
    </div>
  );
}
