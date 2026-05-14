"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Image as ImageIcon, Loader2, Trash2, Recycle, CheckCircle2, Calendar, MessageCircle, Truck, Package } from "lucide-react";
import Link from "next/link";

export default function RecycleNewPage() {
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
    const listStr = localStorage.getItem("wearwise_recycle_draft_list") || localStorage.getItem("wearwise_recycle_item");
    if (listStr) {
      const parsedList = listStr.startsWith("[") ? JSON.parse(listStr) : [JSON.parse(listStr)];
      setDraftList(parsedList);
      
      const initialItems = parsedList.map((draft: any) => ({
        id: draft.id,
        title: draft.title || "Garment for Recycle",
        description: `Bahan: ${draft.fabric || "N/A"}\nWarna: ${draft.color || "N/A"}`,
        image: draft.image,
        fileName: draft.fileName
      }));
      setItemsData(initialItems);
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      if (parsedUser.address) setAddress(parsedUser.address);
    }
  }, []);

  const handleRemoveItem = (index: number) => {
    const newItems = [...itemsData];
    newItems.splice(index, 1);
    setItemsData(newItems);
    if (newItems.length === 0) router.push("/dashboard/scan");
  };

  const handleNextToPartners = async () => {
    setStep(2);
    setLoadingPartners(true);
    try {
      const res = await fetch(`/api/partners?type=recycle&userAddress=${encodeURIComponent(address || "")}`);
      const data = await res.json();
      if (data.success) setPartners(data.data);
    } catch (err: any) {
      setError("Gagal memuat tempat recycle");
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleSubmitRecycle = async () => {
    if (!selectedPartner) return setError("Pilih tempat recycle terlebih dahulu");
    if (deliveryMethod === "pickup" && !address) return setError("Alamat penjemputan harus diisi");
    
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("partnerId", selectedPartner.id);
      formData.append("deliveryMethod", deliveryMethod);
      formData.append("pickupAddress", deliveryMethod === "pickup" ? address : "");
      formData.append("pickupTime", deliveryMethod === "pickup" ? pickupTime : "");
      formData.append("startDate", new Date().toISOString());
      formData.append("type", "recycle");

      const itemsMeta = itemsData.map((item: any) => ({
        scanId: item.id,
        title: item.title,
        description: item.description,
        fileName: item.fileName || "item.jpg",
      }));
      formData.append("items", JSON.stringify(itemsMeta));

      for (const item of itemsData) {
        if (item.image) {
          const arr = item.image.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          const file = new File([new Blob([u8arr], { type: mime })], item.fileName || "item.jpg", { type: mime });
          formData.append("images", file);
        }
      }

      // We can reuse the upcycle API logic or create a similar one for recycle
      const res = await fetch("/api/upcycle", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal mengirim permintaan recycle");

      localStorage.removeItem("wearwise_recycle_draft_list");
      localStorage.removeItem("wearwise_recycle_item");
      router.push("/dashboard?recycled=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (itemsData.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto mb-4" /> Memuat data...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4 pt-4">
        <button onClick={() => step === 1 ? router.push("/dashboard/scan") : setStep((step - 1) as any)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm">
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
          Recycle Flow
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-1">
          {step === 1 ? "Review Barang" : step === 2 ? "Pilih Tempat Recycle" : "Pengiriman & Jadwal"}
        </h1>
        <p className="text-xs text-slate-400">
          {step === 1 ? "Pastikan barang yang akan di-recycle sudah benar." : step === 2 ? "Pilih pusat daur ulang terdekat." : "Atur bagaimana barang akan dikirim."}
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center mb-8 px-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${step >= s ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-slate-100 text-slate-300"}`}>{s}</div>
              {s < 3 && <div className={`h-1 flex-1 rounded-full ${step > s ? "bg-emerald-500" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {itemsData.map((item, index) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 relative group shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{item.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                </div>
                <button onClick={() => handleRemoveItem(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleNextToPartners} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Lanjut Pilih Tempat Recycle</button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          {loadingPartners ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto mb-2" /><p className="text-xs text-slate-400 font-bold uppercase">Mencari Partner...</p></div> : (
            <div className="grid gap-3">
              {partners.map(p => (
                <div key={p.id} onClick={() => setSelectedPartner(p)} className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition-all ${selectedPartner?.id === p.id ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100"}`}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                    {selectedPartner?.id === p.id && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1"><MapPin size={10} /> {p.distance?.toFixed(1)} km - {p.address}</div>
                </div>
              ))}
            </div>
          )}
          <button disabled={!selectedPartner} onClick={() => setStep(3)} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-extrabold disabled:opacity-50 transition-all">Atur Pengiriman</button>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => setDeliveryMethod("drop_off")} className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all ${deliveryMethod === "drop_off" ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white"}`}>
              <div className="text-3xl mb-2">🏢</div>
              <p className="font-bold text-slate-800 text-sm">Drop Off</p>
              <p className="text-[10px] text-slate-400">Antar langsung</p>
            </div>
            <div onClick={() => setDeliveryMethod("pickup")} className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all ${deliveryMethod === "pickup" ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white"}`}>
              <div className="text-3xl mb-2">🚚</div>
              <p className="font-bold text-slate-800 text-sm">Pickup</p>
              <p className="text-[10px] text-slate-400">Jemput di lokasi</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
            {deliveryMethod === "pickup" && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alamat Penjemputan</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm" placeholder="Input alamat lengkap..." rows={2} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Waktu Penjemputan</label>
                  <input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm" />
                </div>
              </>
            )}
            
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
              <MessageCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-700 leading-relaxed">
                Anda dapat mendiskusikan detail jenis bahan yang dapat di-recycle via WhatsApp dengan <strong>{selectedPartner?.name}</strong> setelah membuat pesanan.
              </p>
            </div>
          </div>

          <button disabled={loading} onClick={handleSubmitRecycle} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-extrabold shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <><Recycle size={18} /> Ajukan Recycle Sekarang</>}
          </button>
        </div>
      )}
    </div>
  );
}
