export default function Navbar() {
   return (
      <nav className="bg-primary text-white p-4 flex justify-between">
         <h1 className="font-bold text-lg">WearWise</h1>
         <div className="flex gap-4">
            <a href="/">Home</a>
            <a href="/scan">Scan</a>
            <a href="/marketplace">Marketplace</a>
         </div>
      </nav>
   );
}