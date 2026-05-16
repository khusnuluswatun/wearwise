"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  CheckCircle,
  XCircle,
  Upload,
  UserSearch,
  Loader2,
  Save,
  Tag,
  ShieldCheck,
  Clock,
  AlertTriangle,
  HeartHandshake,
  Scissors,
  Package,
  Star,
  MapPin,
  ChevronRight,
  Info
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface SaleTransaction {
  id: string;
  buyerId: string;
  status: string;
  proofImageUrl: string;
  createdAt: string;
  buyer: { name: string; email: string };
}

interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  userId: string;
  imageUrl: string;
  scanId: string;
  saleTransactions: SaleTransaction[];
  latestTransaction?: any;
  scanData?: {
    result?: string;
    aiDescription?: string;
    aiRecommendation?: string;
  };
}

export default function MyMarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit description state
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);

  // Mark as sold modal
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [soldError, setSoldError] = useState("");
  const [soldSuccess, setSoldSuccess] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [canceling, setCanceling] = useState(false);

  const fetchItem = useCallback(async () => {
    const res = await fetch(`/api/items/${id}`);
    const data = await res.json();
    if (data.success) {
      setItem(data.item);
      setEditDesc(data.item.description || "");
    } else {
      setError("Barang tidak ditemukan.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSaveDescription = async () => {
    if (!currentUser || !item) return;
    setSavingDesc(true);
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: editDesc, userId: currentUser.id }),
    });
    const data = await res.json();
    if (data.success) {
      setItem((prev) => prev ? { ...prev, description: editDesc } : prev);
      setIsEditing(false);
    } else {
      alert("Gagal menyimpan: " + data.error);
    }
    setSavingDesc(false);
  };

  const openSoldModal = async () => {
    setShowSoldModal(true);
    setSelectedBuyer("");
    setProofFile(null);
    setProofPreview(null);
    setSoldError("");
    setSoldSuccess(false);
    setUserSearch("");
    // Fetch users
    const res = await fetch(`/api/users?excludeId=${currentUser?.id}`);
    const data = await res.json();
    if (data.success) setUsers(data.users);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitSold = async () => {
    if (!selectedBuyer || !proofFile || !currentUser || !item) {
      setSoldError("Pilih pembeli dan upload bukti transaksi terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    setSoldError("");

    const formData = new FormData();
    formData.append("itemId", item.id);
    formData.append("sellerId", currentUser.id);
    formData.append("buyerId", selectedBuyer);
    formData.append("proof", proofFile);

    const res = await fetch("/api/sale-transactions", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.success) {
      setSoldSuccess(true);
      await fetchItem();
    } else {
      setSoldError(data.error || "Gagal memproses transaksi.");
    }
    setSubmitting(false);
  };

  const handleCancelSale = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan penjualan ini? Barang akan dihapus dari pasar.")) return;
    setCanceling(true);
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/my-market");
      } else {
        alert("Gagal membatalkan: " + data.error);
        setCanceling(false);
      }
    } catch (e) {
      alert("Error membatalkan penjualan");
      setCanceling(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
    available: {
      label: "Tersedia",
      className: "bg-green-50 text-green-700",
      icon: "🏪",
    },
    pending: {
      label: "Menunggu Verifikasi",
      className: "bg-amber-50 text-amber-700",
      icon: "⏳",
    },
    sold: {
      label: "Sudah Terjual",
      className: "bg-slate-900 text-white",
      icon: "✅",
    },
    donated_pending: {
      label: "Menunggu Donasi",
      className: "bg-rose-50 text-rose-700",
      icon: "🤝",
    },
    donated: {
      label: "Proses Donasi",
      className: "bg-rose-50 text-rose-700",
      icon: "🚚",
    },
    donated_success: {
      label: "Donasi Berhasil",
      className: "bg-green-600 text-white",
      icon: "✨",
    },
    upcycling_pending: {
      label: "Menunggu Upcycle",
      className: "bg-purple-50 text-purple-700",
      icon: "🧵",
    },
    upcycling: {
      label: "Proses Upcycling",
      className: "bg-purple-50 text-purple-700",
      icon: "✂️",
    },
    upcycled: {
      label: "Upcycle Berhasil",
      className: "bg-purple-600 text-white",
      icon: "🎨",
    },
    recycling_pending: {
      label: "Menunggu Recycle",
      className: "bg-blue-50 text-blue-700",
      icon: "♻️",
    },
    recycling: {
      label: "Proses Recycling",
      className: "bg-blue-50 text-blue-700",
      icon: "🚛",
    },
    recycled: {
      label: "Recycle Berhasil",
      className: "bg-blue-600 text-white",
      icon: "🌱",
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400 mb-4" size={40} />
        <p className="text-slate-500 font-bold">Membuka detail lemari...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <XCircle size={64} className="text-red-200 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ups! Terjadi Kesalahan</h2>
        <p className="text-slate-500 mb-8">{error || "Barang tidak ditemukan atau akses ditolak."}</p>
        <Link href="/dashboard/my-market" className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all">
          Kembali ke My Market
        </Link>
      </div>
    );
  }

  const txStatus = statusConfig[item.status] || statusConfig.available;
  const isRejected = item.status === "available" && item.latestTransaction?.status === "rejected";

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-8 pt-6">
        <button onClick={() => router.push("/dashboard/my-market")} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
          <ArrowLeft size={18} /> Kembali ke My Wardrobe
        </button>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${isRejected ? "bg-red-50 text-red-600" : txStatus.className}`}>
          {isRejected ? "Donasi Ditolak" : txStatus.label}
        </div>
      </div>

      {/* Main Content Card - Transaction Style */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden mb-8">
        {/* Top Status Header */}
        <div className={`p-10 text-center ${isRejected ? "bg-red-50" : item.status === "sold" ? "bg-slate-50" : item.status === "pending" ? "bg-amber-50" : "bg-green-50/50"
          }`}>
          <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto mb-6 text-4xl group hover:scale-110 transition-transform">
            {isRejected ? "❌" : txStatus.icon}
          </div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-2 tracking-tight">
            {isRejected ? "Ditolak oleh Partner" : txStatus.label}
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {item.status === "available" ? "Barang tersedia untuk dijual atau donasi" : `Status saat ini: ${txStatus.label}`}
          </p>
        </div>

        <div className="p-10 space-y-10">
          {/* Item Basic Info Row */}
          <div className="flex gap-8 items-start">
            <div className="w-32 h-32 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-inner group">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 py-2">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">{item.title}</h2>
              <div className="flex flex-col gap-3">
                {item.price > 0 && (
                  <p className="text-3xl font-display font-extrabold text-green-600">
                    Rp {item.price.toLocaleString("id-ID")}
                  </p>
                )}
                
                {/* Completion Info for History items */}
                {["sold", "donated_success", "upcycled", "recycled"].includes(item.status) && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <CheckCircle size={14} className="text-green-500" /> Transaksi Selesai
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-slate-700">
                        {item.status === "sold" ? "Dibeli oleh: " : "Diserahkan ke: "}
                        <span className="text-slate-900">
                          {item.status === "sold" 
                            ? item.saleTransactions?.find(t => t.status === "verified")?.buyer?.name || "Pembeli"
                            : item.latestTransaction?.partner?.name || "Partner"}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Diselesaikan pada {new Date(item.status === "sold" 
                          ? item.saleTransactions?.find(t => t.status === "verified")?.verifiedAt || item.createdAt 
                          : item.latestTransaction?.endDate || item.latestTransaction?.createdAt || item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {item.price === 0 && !["sold", "donated_success", "upcycled", "recycled"].includes(item.status) && (
                  <span className="inline-flex items-center w-fit px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-extrabold uppercase rounded-lg border border-rose-100">
                    Mode Donasi / Circular
                  </span>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-50" />

          {/* AI Insights & Metadata */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lokasi Sekarang</p>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin size={14} className="text-blue-500" /> {item.user?.address?.split(',')[0] || "Lemari Utama"}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dibuat Pada</p>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock size={14} className="text-purple-500" /> {new Date(item.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>

            {/* AI Result Parsing if available */}
            {item.scanData?.result && (() => {
              let res: any = {};
              try { res = JSON.parse(item.scanData.result); } catch (e) { }
              return (
                <>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bahan Pakaian</p>
                    <p className="text-sm font-bold text-slate-700">{res.fabric || "Kapas/Polyester"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kondisi AI</p>
                    <p className="text-sm font-bold text-green-600">{res.condition || "Sangat Baik"}</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Description Section */}
          <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Info size={14} /> Deskripsi Barang
              </h3>
              {item.status === "available" && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {isEditing ? "Batal" : "Edit Deskripsi"}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm text-slate-700 focus:ring-4 focus:ring-green-400/20 focus:outline-none bg-white transition-all shadow-inner"
                />
                <button
                  onClick={handleSaveDescription}
                  disabled={savingDesc}
                  className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {savingDesc ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Simpan Perubahan
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {item.description || "Belum ada deskripsi untuk barang ini."}
              </p>
            )}
          </div>

          {/* Rejection Detail if Rejected */}
          {isRejected && (
            <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 flex gap-5 items-start">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl shrink-0">⚠️</div>
              <div>
                <h4 className="text-sm font-bold text-red-600 mb-1">Catatan Penolakan:</h4>
                <p className="text-sm text-red-500 font-medium italic mb-4 leading-relaxed">
                  "{item.latestTransaction?.notes || "Barang tidak memenuhi syarat mitra"}"
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Jangan khawatir! Kamu bisa mencoba mendonasikan ke partner lain atau memilih metode Upcycle/Recycle di bawah.
                </p>
              </div>
            </div>
          )}

          {/* Action Area */}
          {item.status === "available" ? (
            <div className="space-y-10 pt-4">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={openSoldModal}
                  className="w-full py-5 rounded-[1.5rem] bg-slate-900 text-white font-extrabold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group"
                >
                  <CheckCircle size={22} className="group-hover:scale-110 transition-transform" /> Tandai Sudah Terjual
                </button>
              </div>

              {/* Multi-Action Pivot Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Atau Ganti Metode</span>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      const res = item.scanData?.result ? JSON.parse(item.scanData.result) : {};
                      const draft = [{
                        id: item.scanId, title: item.title, condition: res.condition || "Baik",
                        fabric: res.fabric || "Katun", color: res.color || "Mix", image: item.imageUrl, fileName: "item.jpg"
                      }];
                      localStorage.setItem("wearwise_donate_draft_list", JSON.stringify(draft));
                      router.push("/dashboard/donate/new");
                    }}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-blue-50/50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <HeartHandshake size={24} />
                    </div>
                    <span className="text-xs font-extrabold">Donasi</span>
                  </button>

                  <button
                    onClick={() => {
                      const draft = [{ id: item.scanId, title: item.title, image: item.imageUrl, condition: "Baik" }];
                      localStorage.setItem("wearwise_upcycle_draft_list", JSON.stringify(draft));
                      router.push("/dashboard/upcycle/new");
                    }}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-purple-50/50 border border-purple-100 text-purple-600 hover:bg-purple-100 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Scissors size={24} />
                    </div>
                    <span className="text-xs font-extrabold">Upcycle</span>
                  </button>

                  <button
                    onClick={() => {
                      const draft = [{ id: item.scanId, title: item.title, image: item.imageUrl, condition: "Baik" }];
                      localStorage.setItem("wearwise_recycle_draft_list", JSON.stringify(draft));
                      router.push("/dashboard/recycle/new");
                    }}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Package size={24} />
                    </div>
                    <span className="text-xs font-extrabold">Recycle</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleCancelSale}
                disabled={canceling}
                className="w-full py-4 rounded-2xl text-slate-400 font-bold text-xs hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                {canceling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Hapus Permanen dari Lemari
              </button>
            </div>
          ) : (
            <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-md">
                {["sold", "donated_success", "upcycled", "recycled"].includes(item.status) ? (
                  <CheckCircle className="text-green-500" size={28} />
                ) : (
                  <Clock className="text-amber-500 animate-pulse" size={28} />
                )}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">{txStatus.label}</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
                  {["sold", "donated_success", "upcycled", "recycled"].includes(item.status) 
                    ? "Barang ini telah berhasil menyelesaikan siklusnya. Terima kasih telah berkontribusi dalam circular fashion!"
                    : "Item ini sedang dalam tahap transaksi atau pengerjaan mitra. Tindakan baru akan tersedia setelah proses ini selesai."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Final Tip Section */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Star size={60} />
        </div>
        <div className="flex gap-6 items-center relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">💡</div>
          <div>
            <h5 className="font-bold mb-1">Tips Fashion Circular</h5>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Barang yang ditolak bukan berarti tidak berharga. Kadang satu partner memiliki kriteria berbeda dengan yang lain. Cobalah untuk mendonasikan kembali atau ubah menjadi produk upcycle baru!
            </p>
          </div>
        </div>
      </div>

      {/* Mark as Sold Modal - Matching Design */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-extrabold text-slate-900">Konfirmasi Penjualan</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pilih pembeli & upload bukti</p>
              </div>
              <button onClick={() => setShowSoldModal(false)} className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
                <XCircle size={28} />
              </button>
            </div>

            {soldSuccess ? (
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-green-500" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Permintaan Terkirim!</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Pembeli akan menerima notifikasi untuk memverifikasi transaksi ini. Poin reward akan masuk setelah diverifikasi.
                </p>
                <button onClick={() => setShowSoldModal(false)} className="mt-8 px-10 py-4 bg-slate-900 text-white font-extrabold rounded-2xl shadow-xl transition-all active:scale-95">
                  Tutup
                </button>
              </div>
            ) : (
              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pilih Pembeli Terdaftar</label>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama atau email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-4 focus:ring-green-400/10 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-50 divide-y divide-slate-50 bg-white">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedBuyer(u.id)}
                        className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all text-left ${selectedBuyer === u.id ? "bg-green-50/50" : ""}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                        </div>
                        {selectedBuyer === u.id && <CheckCircle size={20} className="text-green-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bukti Transaksi (Screenshot WA/Transfer)</label>
                  <label className="block w-full cursor-pointer group">
                    <div className={`border-2 border-dashed rounded-3xl transition-all text-center overflow-hidden h-44 flex items-center justify-center ${proofPreview ? "border-green-200 bg-green-50/30" : "border-slate-100 bg-slate-50 group-hover:border-green-300"
                      }`}>
                      {proofPreview ? (
                        <img src={proofPreview} alt="Bukti" className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload size={32} className="text-slate-300 group-hover:text-green-400 transition-colors" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klik untuk pilih file</p>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProofChange} />
                  </label>
                </div>

                <button
                  onClick={handleSubmitSold}
                  disabled={submitting || !selectedBuyer || !proofFile}
                  className="w-full py-5 rounded-[1.5rem] bg-green-500 text-white font-extrabold text-lg shadow-xl shadow-green-200 hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
                  Konfirmasi Penjualan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
