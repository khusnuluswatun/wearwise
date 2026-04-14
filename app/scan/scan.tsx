import Navbar from "@/components/ui/Navbar";

export default function ScanPage() {
   return (
      <>
         <Navbar />
         <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Scan Pakaian</h1>
            <p>Upload gambar untuk dianalisis AI</p>
         </main>
      </>
   );
}