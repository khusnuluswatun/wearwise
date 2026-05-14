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
  saleTransactions: SaleTransaction[];
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

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    available: {
      label: "Tersedia",
      className: "bg-green-100 text-green-700",
      icon: <Tag size={14} />,
    },
    pending: {
      label: "Menunggu Verifikasi",
      className: "bg-amber-100 text-amber-700",
      icon: <Clock size={14} />,
    },
    sold: {
      label: "Terjual",
      className: "bg-slate-100 text-slate-600",
      icon: <CheckCircle size={14} />,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-500" size={36} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-slate-500">{error || "Barang tidak ditemukan."}</p>
        <Link href="/dashboard/my-market" className="mt-4 inline-block text-green-600 font-bold hover:underline">
          Kembali
        </Link>
      </div>
    );
  }

  // Check ownership
  if (currentUser && item.userId !== currentUser.id) {
    router.replace("/dashboard/my-market");
    return null;
  }

  const txStatus = statusConfig[item.status] || statusConfig.available;
  const latestTx = item.saleTransactions?.[0];

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/dashboard/my-market"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold mb-8"
      >
        <ArrowLeft size={20} /> Kembali ke My Market
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Image */}
        <div className="md:w-2/5 bg-slate-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100 min-h-[380px]">
          <div className="relative w-full max-w-xs rounded-2xl overflow-hidden shadow-sm aspect-[4/5] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Right: Details */}
        <div className="md:w-3/5 p-8 md:p-10 flex flex-col gap-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${txStatus.className}`}>
              {txStatus.icon} {txStatus.label}
            </span>
          </div>

          {/* Title & Price */}
          <div>
            <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-2 leading-tight">{item.title}</h1>
            <p className="text-3xl font-display font-extrabold text-green-600">
              Rp {item.price.toLocaleString("id-ID")}
            </p>
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">Deskripsi Barang</h3>
              {item.status === "available" && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Edit3 size={14} /> {isEditing ? "Batal" : "Edit"}
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  placeholder="Tulis deskripsi barang..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-white"
                />
                <button
                  onClick={handleSaveDescription}
                  disabled={savingDesc}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {savingDesc ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Simpan Deskripsi
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {item.description || <span className="italic text-slate-400">Belum ada deskripsi.</span>}
              </p>
            )}
          </div>

          {/* AI Analysis Insights */}
          {item.scanData?.result && (() => {
            let resultData: any = {};
            try {
              resultData = JSON.parse(item.scanData.result);
            } catch (e) {}
            
            return (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-slate-700">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Star size={80} />
                </div>
                
                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-500" /> AI WearWise Analysis
                </h3>
                
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">Fabric</p>
                    <p className="text-xs font-extrabold truncate">{resultData.fabric || "-"}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">Condition</p>
                    <p className="text-xs font-extrabold text-green-400 truncate">{resultData.condition || "Baik"}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">Color</p>
                    <p className="text-xs font-extrabold truncate">{resultData.color || "-"}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">AI Value</p>
                    <p className="text-xs font-extrabold text-amber-400 truncate">Rp {resultData.sellPrice || "-"}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Transaction info (if pending or sold) */}
          {latestTx && (
            <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
              item.status === "pending" ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"
            }`}>
              {item.status === "pending" ? (
                <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {item.status === "pending"
                    ? "Menunggu konfirmasi dari pembeli"
                    : "Transaksi telah diverifikasi"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pembeli: <span className="font-semibold text-slate-700">{latestTx.buyer?.name}</span>
                </p>
                <Link
                  href={latestTx.proofImageUrl}
                  target="_blank"
                  className="text-xs text-blue-600 font-semibold hover:underline mt-1 inline-block"
                >
                  Lihat Bukti Transaksi →
                </Link>
              </div>
            </div>
          )}

          {/* Action Button */}
          {item.status === "available" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={openSoldModal}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold text-base shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} /> Tandai Sudah Terjual
              </button>

              <button
                onClick={handleCancelSale}
                disabled={canceling}
                className="w-full py-3 rounded-2xl bg-white border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {canceling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Batalkan Penjualan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mark as Sold Modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Konfirmasi Penjualan</h2>
                <p className="text-sm text-slate-500 mt-0.5">Pilih pembeli & upload bukti transaksi</p>
              </div>
              <button
                onClick={() => setShowSoldModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {soldSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="text-green-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Permintaan Terkirim!</h3>
                <p className="text-slate-500 text-sm">
                  Notifikasi verifikasi telah dikirim ke pembeli. Kamu akan mendapatkan poin setelah pembeli mengkonfirmasi.
                </p>
                <button
                  onClick={() => setShowSoldModal(false)}
                  className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Buyer Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <UserSearch size={16} className="inline mr-1.5" />
                    Pilih Pembeli
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari nama atau email pembeli..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                    {filteredUsers.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400 text-center">Tidak ada user ditemukan</p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedBuyer(u.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                            selectedBuyer === u.id ? "bg-green-50 border-l-4 border-l-green-500" : ""
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                          {selectedBuyer === u.id && (
                            <CheckCircle size={18} className="text-green-500 ml-auto shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Proof Upload */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Upload size={16} className="inline mr-1.5" />
                    Upload Bukti Transaksi
                  </label>
                  <label className="block w-full cursor-pointer">
                    <div className={`border-2 border-dashed rounded-2xl transition-colors text-center overflow-hidden ${
                      proofPreview ? "border-green-300 bg-green-50" : "border-slate-200 hover:border-green-400 bg-slate-50"
                    }`}>
                      {proofPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proofPreview} alt="Bukti" className="w-full max-h-48 object-contain p-2 rounded-xl" />
                      ) : (
                        <div className="py-8 flex flex-col items-center gap-2">
                          <Upload size={28} className="text-slate-300" />
                          <p className="text-sm font-semibold text-slate-500">Klik untuk upload foto bukti</p>
                          <p className="text-xs text-slate-400">JPG, PNG, WEBP (maks. 5MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProofChange}
                    />
                  </label>
                </div>

                {soldError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    <AlertTriangle size={16} />
                    {soldError}
                  </div>
                )}

                <button
                  onClick={handleSubmitSold}
                  disabled={submitting || !selectedBuyer || !proofFile}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold text-base shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  {submitting ? "Memproses..." : "Kirim Konfirmasi"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
