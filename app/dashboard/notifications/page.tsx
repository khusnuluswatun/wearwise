"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  ShieldCheck,
  XCircle,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  ArrowLeft,
} from "lucide-react";

interface Notification {
  id: string;
  itemId: string;
  proofImageUrl: string;
  createdAt: string;
  status: string;
  item: {
    id: string;
    title: string;
    price: number;
  };
  seller: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { type: "success" | "error"; msg: string }>>({});

  const fetchNotifications = useCallback(async (uid: string) => {
    setLoading(true);
    const res = await fetch(`/api/notifications?buyerId=${uid}`);
    const data = await res.json();
    if (data.success) setNotifications(data.notifications);
    setLoading(false);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserId(u.id);
      fetchNotifications(u.id);
    } else {
      setLoading(false);
    }
  }, [fetchNotifications]);

  const handleAction = async (txId: string, action: "verify" | "reject") => {
    if (!userId) return;
    setProcessing(txId);

    const res = await fetch(`/api/sale-transactions/${txId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, buyerId: userId }),
    });
    const data = await res.json();

    if (data.success) {
      setFeedback((prev) => ({
        ...prev,
        [txId]: {
          type: "success",
          msg:
            action === "verify"
              ? "✅ Transaksi dikonfirmasi! Penjual mendapatkan poin."
              : "❌ Transaksi ditolak.",
        },
      }));
      // Remove from list after 2s
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== txId));
        setFeedback((prev) => {
          const copy = { ...prev };
          delete copy[txId];
          return copy;
        });
      }, 2500);
    } else {
      setFeedback((prev) => ({
        ...prev,
        [txId]: { type: "error", msg: data.error || "Gagal memproses." },
      }));
    }
    setProcessing(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold mb-8"
      >
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Bell size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-800">Notifikasi</h1>
          <p className="text-slate-500">Konfirmasi transaksi yang perlu diverifikasi</p>
        </div>
        {notifications.length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-sm">
            {notifications.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-violet-500" size={36} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Bell size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Tidak Ada Notifikasi</h3>
          <p className="text-slate-500">Semua transaksi sudah diverifikasi atau belum ada yang masuk.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const fb = feedback[n.id];
            const isProcessing = processing === n.id;

            return (
              <div
                key={n.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Notification Header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                  <Clock size={18} className="text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Penjual <span className="text-amber-600">{n.seller.name}</span> meminta konfirmasi transaksi
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Item Info */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Package size={22} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{n.item.title}</p>
                      <p className="text-green-600 font-extrabold font-display">
                        Rp {n.item.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Proof image */}
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bukti Transaksi</p>
                    <button
                      onClick={() => setViewProof(n.proofImageUrl)}
                      className="group relative w-full max-h-48 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center hover:border-violet-200 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={n.proofImageUrl}
                        alt="Bukti transaksi"
                        className="max-h-48 object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors rounded-2xl flex items-center justify-center">
                        <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/60 px-3 py-1.5 rounded-lg">
                          Perbesar
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Feedback message */}
                  {fb && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold mb-4 ${
                      fb.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {fb.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      {fb.msg}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!fb && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(n.id, "verify")}
                        disabled={isProcessing}
                        className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-green-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={18} />
                        )}
                        Ya, Konfirmasi Transaksi
                      </button>
                      <button
                        onClick={() => handleAction(n.id, "reject")}
                        disabled={isProcessing}
                        className="flex-1 py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-sm border border-red-100 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof image modal */}
      {viewProof && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewProof(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewProof} alt="Bukti Transaksi" className="w-full rounded-3xl shadow-2xl" />
            <button
              onClick={() => setViewProof(null)}
              className="mt-4 mx-auto block px-6 py-3 bg-white rounded-2xl font-bold text-slate-700 shadow-lg hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
