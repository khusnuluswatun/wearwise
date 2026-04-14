import Navbar from "@/components/ui/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-4">
          Smart Clothing Lifecycle Platform
        </h1>
        <p>
          Scan pakaianmu dan temukan tindakan terbaik: jual, donasi, atau recycle.
        </p>
      </main>
    </>
  );
}