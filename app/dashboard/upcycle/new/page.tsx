"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tag, MapPin, Image as ImageIcon, Loader2, Trash2, Scissors, CheckCircle2, Calendar, CreditCard, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function UpcycleNewPage() {
  const router = useRouter();
  const [draftList, setDraftList] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemsData, setItemsData] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState(""); // General request for all items
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"drop_off" | "pickup">("drop_off");
  const [pickupTime, setPickupTime] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    const listStr = localStorage.getItem("wearwise_upcycle_draft_list") || localStorage.getItem("wearwise_upcycle_item");
    if (listStr) {
      const parsedList = listStr.startsWith("[") ? JSON.parse(listStr) : [JSON.parse(listStr)];
      setDraftList(parsedList);
      
      const initialItems = parsedList.map((draft: any) => ({
        id: draft.id,
        title: draft.title || "",
        description: `Bahan: ${draft.fabric || "N/A"}\nWarna: ${draft.color || "N/A"}`,
        request: "", // Specific request for this item
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

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...itemsData];
    newItems[index][field as keyof any] = value;
    setItemsData(newItems);
  };

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
      const res = await fetch(`/api/partners?type=upcycle&userAddress=${encodeURIComponent(address || "")}`);
      const data = await res.json();
      if (data.success) setPartners(data.data);
    } catch (err: any) {
      setError("Gagal memuat partner upcycle");
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleSubmitUpcycle = async () => {
    if (!selectedPartner) return setError("Pilih partner upcycle terlebih dahulu");
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
      formData.append("startDate", startDate);
      formData.append("paymentMethod", paymentMethod);
      formData.append("notes", notes);
      formData.append("price", "50000"); // Standard base price for upcycling service

      const itemsMeta = itemsData.map((item: any) => ({
        scanId: item.id,
        title: item.title,
        description: `${item.description}\nRequest: ${item.request}`,
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

      const res = await fetch("/api/upcycle", { method: "POST", body: formData });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim permintaan upcycle");
      }

      localStorage.removeItem("wearwise_upcycle_draft_list");
      localStorage.removeItem("wearwise_upcycle_item");
      router.push("/dashboard?upcycled=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const estFinishDate = new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (itemsData.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto mb-4" /> Memuat data...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4 pt-4">
        <button onClick={() => step === 1 ? router.push("/dashboard/scan") : setStep((step - 1) as any)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm">
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-purple-50 text-purple-600 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
          Upcycle Flow
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-1">
          {step === 1 ? "Detail Upcycle" : step === 2 ? "Pilih Penjahit/Partner" : "Logistik & Pembayaran"}
        </h1>
        <p className="text-xs text-slate-400">
          {step === 1 ? "Tentukan apa yang ingin kamu buat dari pakaian ini." : step === 2 ? "Pilih partner upcycle terpercaya." : "Atur jadwal dan metode pembayaran."}
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center mb-8 px-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${step >= s ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" : "bg-slate-100 text-slate-300"}`}>{s}</div>
              {s < 3 && <div className={`h-1 flex-1 rounded-full ${step > s ? "bg-purple-500" : "bg-slate-100"}`} />}
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
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-4 relative group shadow-sm">
                <div className="w-24 h-24 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-3">
                  <input value={item.title} onChange={e => handleItemChange(index, "title", e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 font-bold text-sm" placeholder="Nama Barang" />
                  <textarea rows={2} value={item.request} onChange={e => handleItemChange(index, "request", e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px]" placeholder="Ingin dibuat apa? (Contoh: Jadikan totebag atau sarung bantal)" />
                  <div className="text-[10px] text-slate-400 italic bg-purple-50 p-2 rounded-lg flex items-center gap-2">
                    <MessageCircle size={12} className="text-purple-500" /> Detail lebih lanjut akan dibicarakan via WhatsApp setelah order dibuat.
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleNextToPartners} className="w-full py-4 rounded-2xl bg-purple-600 text-white font-extrabold shadow-lg shadow-purple-500/20 active:scale-95 transition-all">Lanjut Pilih Partner</button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          {loadingPartners ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto mb-2" /><p className="text-xs text-slate-400 font-bold">Mencari UMKM/Partner...</p></div> : (
            <div className="grid gap-3">
              {partners.map((p: any) => (
                <div key={p.id} onClick={() => setSelectedPartner(p)} className={`bg-white rounded-2xl p-4 border-2 cursor-pointer ${selectedPartner?.id === p.id ? "border-purple-500 bg-purple-50/20" : "border-slate-100"}`}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                    {selectedPartner?.id === p.id && <CheckCircle2 size={16} className="text-purple-500" />}
                  </div>
                  <div className="text-[10px] text-purple-600 font-bold mt-1 flex items-center gap-1"><MapPin size={10} /> {p.distance?.toFixed(1)} km - {p.address}</div>
                </div>
              ))}
            </div>
          )}
          <button disabled={!selectedPartner} onClick={() => setStep(3)} className="w-full py-4 rounded-2xl bg-purple-600 text-white font-extrabold disabled:opacity-50 transition-all">Atur Jadwal & Pembayaran</button>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => setDeliveryMethod("drop_off")} className={`p-4 rounded-2xl border-2 text-center cursor-pointer ${deliveryMethod === "drop_off" ? "border-purple-500 bg-purple-50" : "border-slate-100 bg-white"}`}>
              <div className="text-2xl mb-1">🏢</div>
              <p className="font-bold text-sm">Delivery</p>
            </div>
            <div onClick={() => setDeliveryMethod("pickup")} className={`p-4 rounded-2xl border-2 text-center cursor-pointer ${deliveryMethod === "pickup" ? "border-purple-500 bg-purple-50" : "border-slate-100 bg-white"}`}>
              <div className="text-2xl mb-1">🚚</div>
              <p className="font-bold text-sm">Pickup</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1"><Calendar size={10} /> Jadwal Mulai Pengerjaan</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1"><CreditCard size={10} /> Metode Pembayaran</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm outline-none">
                <option>Transfer Bank</option>
                <option>E-Wallet (OVO/Dana)</option>
                <option>COD (Bayar saat selesai)</option>
              </select>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
              <p className="text-[10px] text-purple-700">
                Estimasi Barang Selesai: <strong className="text-purple-900">{estFinishDate}</strong>
              </p>
            </div>
          </div>

          <button disabled={loading} onClick={handleSubmitUpcycle} className="w-full py-4 rounded-2xl bg-purple-600 text-white font-extrabold shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "Buat Pesanan Upcycle ✂️"}
          </button>
        </div>
      )}
    </div>
  );
}
