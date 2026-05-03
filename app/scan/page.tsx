import Navbar from "@/components/ui/Navbar";
import ScanFeature from "@/components/ScanFeature";

export default function PublicScanPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="pt-20 pb-10">
        <ScanFeature />
      </div>
    </div>
  );
}
