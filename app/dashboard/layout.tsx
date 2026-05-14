"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ScanLine, 
  ShoppingBag,
  Store,
  LogOut, 
  Leaf,
  Menu,
  X,
  Bell
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      // Fetch pending notification count
      fetch(`/api/notifications?buyerId=${u.id}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setNotifCount(d.notifications.length); })
        .catch(() => {});
    }
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: 0 },
    { name: "Scan", href: "/dashboard/scan", icon: ScanLine, badge: 0 },
    { name: "Market", href: "/dashboard/market", icon: ShoppingBag, badge: 0 },
    { name: "My Market", href: "/dashboard/my-market", icon: Store, badge: 0 },
    { name: "Notifikasi", href: "/dashboard/notifications", icon: Bell, badge: notifCount },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-md text-slate-700"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-24 flex items-center px-8 border-b border-slate-100/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/30">
              <Leaf size={24} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">
              WearWise
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 shadow-sm border border-green-100"
                    : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-green-500" : "text-slate-400"} />
                {item.name}
                {item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-100/50">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 leading-tight">{user?.name || "User"}</span>
                <span className="text-xs font-medium text-slate-500">Free Account</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 lg:ml-72 transition-all duration-300 flex flex-col min-h-screen`}>
        <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
