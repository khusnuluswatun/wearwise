import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MessageCircle, User, ShieldCheck } from "lucide-react";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const item = await prisma.item.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!item) return notFound();

  const scan = await prisma.scan.findUnique({
    where: { id: item.scanId }
  });

  const imageUrl = scan?.imageUrl || "/placeholder.png";

  const waMessage = encodeURIComponent(`Halo ${item.user.name},\nSaya tertarik dengan barang "${item.title}" yang Anda jual di WearWise seharga Rp ${item.price.toLocaleString("id-ID")}.\nApakah barang ini masih tersedia?`);
  
  // Format phone to standard wa.me format (ensure it starts with country code without + or 0)
  let phoneStr = item.user.phone || "";
  if (phoneStr.startsWith("0")) phoneStr = "62" + phoneStr.substring(1);
  if (phoneStr.startsWith("+")) phoneStr = phoneStr.substring(1);
  
  const waLink = `https://wa.me/${phoneStr}?text=${waMessage}`;

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard/market" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold mb-8">
        <ArrowLeft size={20} /> Kembali ke Marketplace
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Image */}
        <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100 min-h-[400px]">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-sm aspect-[4/5] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Right: Details */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col">
          <div className="mb-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {item.status}
            </span>
          </div>
          
          <h1 className="text-3xl font-display font-extrabold text-slate-800 mb-4 leading-tight">{item.title}</h1>
          <p className="text-4xl font-display font-extrabold text-green-600 mb-8">
            Rp {item.price.toLocaleString("id-ID")}
          </p>

          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Deskripsi Barang</h3>
              <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {item.description || "Tidak ada deskripsi."}
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {item.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  {item.user.name} <ShieldCheck size={16} className="text-blue-500" />
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {item.user.address || "Alamat tidak tersedia"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <a 
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#1ebd5b] text-white font-extrabold text-lg shadow-lg shadow-[#25D366]/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            >
              <MessageCircle size={24} /> Hubungi Penjual via WhatsApp
            </a>
            <p className="text-center text-xs text-slate-400 mt-3">Transaksi dilakukan di luar platform WearWise.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
