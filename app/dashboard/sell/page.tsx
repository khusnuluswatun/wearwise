import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Tag, MapPin, Star } from "lucide-react";

// For demo purposes, we will fetch all items. In a real app, this might be filtered or paginated.
export default async function SellMarketPage() {
  const items = await prisma.item.findMany({
    where: {
      status: "available"
    },
    include: {
      user: true,
    }
  });

  // We need to fetch scans manually if relation is missing, let's check.
  // I will just fetch all scans and map them.
  const scans = await prisma.scan.findMany();
  
  const marketItems = items.map(item => {
    const scan = scans.find(s => s.id === item.scanId);
    return {
      ...item,
      imageUrl: scan?.imageUrl || "/placeholder.png"
    };
  }).reverse(); // Quick sort descending

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-800 mb-2">My Marketplace</h1>
          <p className="text-slate-500">Kelola dan lihat barang-barang yang sedang kamu jual.</p>
        </div>
        <Link 
          href="/dashboard/scan" 
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={20} /> Jual Barang Baru
        </Link>
      </div>

      {marketItems.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Tag size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Barang</h3>
          <p className="text-slate-500 max-w-sm mb-6">Kamu belum menjual apapun. Mulai scan pakaian lamamu dan ubah menjadi uang!</p>
          <Link href="/dashboard/scan" className="text-green-500 font-bold hover:underline">
            Scan Sekarang →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {marketItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border border-white/50 flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-slate-700">Mulus</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 line-clamp-1 flex-1 pr-2">{item.title}</h3>
                </div>
                <p className="text-lg font-display font-extrabold text-green-600 mb-3">
                  Rp {item.price.toLocaleString("id-ID")}
                </p>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={14} />
                    <span className="text-xs font-medium truncate max-w-[120px]">
                      {item.user?.address || "Alamat tidak tersedia"}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
