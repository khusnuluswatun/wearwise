"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tag, MapPin, AlignLeft, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SellNewPage() {
  const router = useRouter();
  const [draftList, setDraftList] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We need to maintain an array of formData, one for each item
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [address, setAddress] = useState("");

  useEffect(() => {
    // Load draft data list
    const listStr = localStorage.getItem("wearwise_sell_draft_list");
    if (listStr) {
      const parsedList = JSON.parse(listStr);
      setDraftList(parsedList);
      
      const initialItems = parsedList.map((draft: any) => ({
        id: draft.id,
        title: draft.title || "",
        price: draft.price || "",
        description: `Kondisi: ${draft.condition}\nBahan: ${draft.fabric}\nWarna: ${draft.color}\n\n`,
        image: draft.image,
        fileName: draft.fileName
      }));
      setItemsData(initialItems);
    }

    // Load user and fetch latest address from DB
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      
      // Fallback initially
      if (parsedUser.address) {
        setAddress(parsedUser.address);
      }

      // Fetch fresh address from DB
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
    localStorage.setItem("wearwise_sell_draft_list", JSON.stringify(newDraftList));
    
    if (newItems.length === 0) {
      router.push("/dashboard/scan");
    }
  };

  // Convert Base64 back to file
  function dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename || "image.jpg", { type: mime });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsData.length === 0) return;
    
    setLoading(true);
    setError(null);

    try {
      // Loop and upload each item
      const promises = itemsData.map(async (itemData) => {
        const file = dataURLtoFile(itemData.image, itemData.fileName || "item.jpg");
        
        const payload = new FormData();
        payload.append("userId", user?.id || "dummy-user-id");
        payload.append("title", itemData.title);
        payload.append("description", itemData.description);
        payload.append("price", itemData.price);
        payload.append("address", address);
        payload.append("image", file);

        const res = await fetch("/api/items", {
          method: "POST",
          body: payload
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menyimpan barang");
        return data;
      });

      await Promise.all(promises);

      // Clear draft and redirect
      localStorage.removeItem("wearwise_sell_draft_list");
      router.push("/dashboard/my-market");

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (itemsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
        <p className="text-slate-500">Memuat data barang...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/scan" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold">
          <ArrowLeft size={20} /> Kembali ke Scan
        </Link>
        <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-lg text-sm">
          {itemsData.length} Barang dalam antrean
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-slate-800 mb-2">Upload Banyak Barang Sekaligus</h1>
        <p className="text-slate-500">Periksa detail jualan dari barang-barang yang sudah kamu scan. Alamat pengiriman berlaku untuk semua barang.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Global Address */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-rose-500" /> Alamat Penjemputan / Pengiriman
          </h2>
          <textarea 
            required
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none resize-none"
            placeholder="Masukkan alamat lengkap penjemputan barang (berlaku untuk semua penjualan ini)..."
          />
        </div>

        {/* List of Items */}
        <div className="space-y-6">
          {itemsData.map((item, index) => (
            <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row relative group">
              
              <button 
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                title="Hapus barang ini"
              >
                <Trash2 size={16} />
              </button>

              {/* Image Preview */}
              <div className="md:w-1/3 bg-slate-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 min-h-[300px]">
                <div className="relative w-full max-w-[200px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white aspect-[3/4] flex items-center justify-center">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm border border-white/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-700">AI Analyzed</span>
                  </div>
                </div>
              </div>

              {/* Form Inputs for this item */}
              <div className="md:w-2/3 p-6 md:p-8 space-y-5">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <Tag size={16} className="text-amber-500" /> Nama Barang
                    </label>
                    <input 
                      required
                      type="text"
                      value={item.title}
                      onChange={(e) => handleItemChange(index, "title", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <span className="text-green-500 font-bold text-lg leading-none">Rp</span> Harga
                    </label>
                    <input 
                      required
                      type="text"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <AlignLeft size={16} className="text-blue-500" /> Deskripsi Barang
                  </label>
                  <textarea 
                    required
                    rows={3}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-6 z-20">
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-lg shadow-xl shadow-green-500/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              `🚀 Upload ${itemsData.length} Barang ke Market Sekarang`
            )}
          </button>
        </div>
      </form>

    </div>
  );
}
