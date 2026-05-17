"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tag, MapPin, Image as ImageIcon, Loader2, Trash2, HeartHandshake, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DonateNewPage() {
  const router = useRouter();
  const [draftList, setDraftList] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemsData, setItemsData] = useState<any[]>([]);
  const [address, setAddress] = useState("");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"drop_off" | "pickup">("drop_off");
  const [pickupTime, setPickupTime] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    const listStr = localStorage.getItem("wearwise_donate_draft_list");
    if (listStr) {
      const parsedList = JSON.parse(listStr);
      setDraftList(parsedList);

      const initialItems = parsedList.map((draft: any) => ({
        id: draft.id,
        title: draft.title || "",
        description: `Kondisi: ${draft.condition}\nBahan: ${draft.fabric}\nWarna: ${draft.color}`,
        image: draft.image,
        fileName: draft.fileName
      }));
      setItemsData(initialItems);
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);

      if (parsedUser.address) {
        setAddress(parsedUser.address);
      }

      fetch(`/api/user?id=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user?.address) {
            setAddress(data.user.address);
          }
        })
        .catch(err => console.error("Failed to fetch fresh address:", err));
    }
  }, []);

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...itemsData];
    newItems[index][field] = value;
    setItemsData(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...itemsData];
    newItems.splice(index, 1);
    setItemsData(newItems);

    const newDraftList = [...draftList];
    newDraftList.splice(index, 1);
    setDraftList(newDraftList);
    localStorage.setItem("wearwise_donate_draft_list", JSON.stringify(newDraftList));

    if (newItems.length === 0) {
      router.push("/dashboard/scan");
    }
  };

  const handleNextToPartners = async () => {
    setError(null);
    setStep(2);
    setLoadingPartners(true);

    try {
      // Find partners based on user's saved address or just all donate partners
      const res = await fetch(`/api/partners?type=donate&userAddress=${encodeURIComponent(address || "")}`);
      const data = await res.json();
      if (data.success) {
        setPartners(data.data);
      } else {
        setError(data.error || "Gagal memuat tempat donasi");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleSubmitDonation = async () => {
    if (!selectedPartner) {
      setError("Pilih tempat donasi terlebih dahulu");
      return;
    }
    if (deliveryMethod === "pickup" && !address) {
      setError("Alamat penjemputan harus diisi");
      return;
    }
    if (deliveryMethod === "pickup" && !pickupTime) {
      setError("Waktu penjemputan harus diisi");
      return;
    }
    if (!user) {
      setError("Kamu harus login untuk melakukan donasi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("partnerId", selectedPartner.id);
      formData.append("deliveryMethod", deliveryMethod);
      formData.append("pickupAddress", deliveryMethod === "pickup" ? address : "");
      formData.append("pickupTime", deliveryMethod === "pickup" ? pickupTime : "");

      // Attach items metadata
      const itemsMeta = itemsData.map((item: any) => ({
        scanId: item.id, // This is the scanId from localStorage
        title: item.title,
        description: item.description,
        fileName: item.fileName || "item.jpg",
      }));
      formData.append("items", JSON.stringify(itemsMeta));

      // Convert base64 images back to File blobs and attach
      for (const item of itemsData) {
        if (item.image) {
          const arr = item.image.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          const blob = new Blob([u8arr], { type: mime });
          const file = new File([blob], item.fileName || "item.jpg", { type: mime });
          formData.append("images", file);
        }
      }

      const res = await fetch("/api/donations", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim donasi");

      localStorage.removeItem("wearwise_donate_draft_list");
      router.push("/dashboard?donated=1");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (itemsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500">Memuat data barang...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      <div className="flex items-center justify-between mb-4 pt-4">
        <button
          onClick={() => {
            if (step === 1) router.push("/dashboard/scan");
            else setStep((step - 1) as any);
          }}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
          {itemsData.length} Items
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-1">
          {step === 1 ? "Review Barang" : step === 2 ? "Pilih Partner" : "Metode Pengiriman"}
        </h1>
        <p className="text-xs text-slate-400">
          {step === 1 ? "Periksa barang donasi kamu." : step === 2 ? "Pilih lokasi donasi terdekat." : "Bagaimana kamu akan mengirimkan barang?"}
        </p>
      </div>

      {/* Progress Steps - 3 Steps */}
      <div className="flex items-center justify-center mb-8 px-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${step >= s ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-300"
                }`}>{s}</div>
              {s < 3 && <div className={`h-1 flex-1 rounded-full ${step > s ? "bg-blue-500" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">
          {error}
        </div>
      )}

      {/* STEP 1: Review Items */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="grid gap-3">
            {itemsData.map((item, index) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-4 relative group">
                <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-4 text-slate-200" />}
                </div>
                <div className="flex-1 min-w-0 space-y-2 w-full">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, "title", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all"
                    placeholder="Nama barang..."
                  />
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 outline-none text-[10px] text-slate-600 transition-all resize-none"
                    placeholder="Deskripsi barang..."
                  />
                </div>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleNextToPartners} className="w-full py-4 rounded-2xl bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            Lanjut Pilih Partner
          </button>
        </div>
      )}

      {/* STEP 2: Choose Partner */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
          {loadingPartners ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mencari Partner...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {partners.map((partner: any) => (
                <div 
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer ${selectedPartner?.id === partner.id ? "border-blue-500 bg-blue-50/20" : "border-slate-100"
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">{partner.name}</h3>
                    {selectedPartner?.id === partner.id && <CheckCircle2 size={16} className="text-blue-500" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 mb-2">
                    <MapPin size={10} /> {partner.distance ? `${partner.distance.toFixed(1)} km` : "Lokasi Terdekat"}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{partner.address}</p>
                </div>
              ))}
            </div>
          )}
          <button
            disabled={!selectedPartner}
            onClick={() => setStep(3)}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-500/20 disabled:opacity-50 active:scale-95 transition-all"
          >
            Pilih Metode Pengiriman
          </button>
        </div>
      )}

      {/* STEP 3: Logistics */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setDeliveryMethod("drop_off")}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3 ${deliveryMethod === "drop_off" ? "border-blue-500 bg-blue-50/30" : "border-slate-100 bg-white"
                }`}
            >
              <div className="text-3xl">🏢</div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">Drop Off</p>
                <p className="text-[10px] text-slate-400">Antar langsung</p>
              </div>
            </div>
            <div
              onClick={() => setDeliveryMethod("pickup")}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3 ${deliveryMethod === "pickup" ? "border-blue-500 bg-blue-50/30" : "border-slate-100 bg-white"
                }`}
            >
              <div className="text-3xl">🚚</div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">Pickup</p>
                <p className="text-[10px] text-slate-400">Jemput di rumah</p>
              </div>
            </div>
          </div>

          {deliveryMethod === "pickup" && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="bg-white p-5 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Detail Penjemputan</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 outline-none text-sm transition-all"
                      placeholder="Input alamat lengkap..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Waktu Penjemputan</label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {deliveryMethod === "drop_off" && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[11px] text-blue-700 font-medium">
                Kamu akan mengantarkan barang ke <strong>{selectedPartner?.name}</strong> di alamat: <br />
                <span className="text-blue-500">{selectedPartner?.address}</span>
              </p>
            </div>
          )}

          <button
            disabled={loading}
            onClick={handleSubmitDonation}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Kirim Donasi 🤝"}
          </button>
        </div>
      )}
    </div>
  );
}
