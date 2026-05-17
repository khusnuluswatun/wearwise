"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Clock,
  Leaf
} from "lucide-react";

export default function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [partnerUser, setPartnerUser] = useState<any>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user") || localStorage.getItem("partner_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setPartnerUser(user);

    // If we have partner info in user object, set it immediately
    if (user.partner) {
      setPartnerInfo(user.partner);
    }

    // Still fetch fresh details to be sure
    fetch(`/api/partners?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length > 0) {
          const freshPartner = d.data[0];
          setPartnerInfo(freshPartner);
          // Update localStorage with fresh partner info
          const updatedUser = { ...user, partner: freshPartner };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      })
      .catch(() => {});
  }, [router]);

  const isUpcycle = partnerInfo?.type === "upcycle" || partnerInfo?.type === "umkm";
  const isRecycle = partnerInfo?.type === "recycle";
  const isService = isUpcycle || isRecycle;

  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (partnerInfo?.id) {
      const endpoint = isService ? `/api/upcycles?partnerId=${partnerInfo.id}&status=pending` : `/api/donations?partnerId=${partnerInfo.id}&status=pending`;
      fetch(endpoint)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setNotifCount(d.data.length);
          }
        })
        .catch(err => console.error("Failed to fetch partner notifs:", err));
    }
  }, [partnerInfo, isService]);

  const navItems = isService
    ? [
        { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard, badge: 0 },
        { name: isRecycle ? "Recycle Masuk" : "Upcycle Masuk", href: "/partner/dashboard/upcycles", icon: Leaf, badge: notifCount },
      ]
    : [
        { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard, badge: 0 },
        { name: "Donasi Masuk", href: "/partner/dashboard/donations", icon: Heart, badge: notifCount },
      ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("partner_user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-white rounded-xl shadow-md text-slate-700 border border-slate-100"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-24 flex items-center px-8 border-b border-slate-100/50">
          <Link href="/partner/dashboard" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/30">
              <Leaf size={24} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-2xl font-display font-extrabold text-slate-800 tracking-tight block leading-tight">
                WearWise
              </span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                Partner Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Partner info pill */}
        {partnerInfo && (
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
            <p className="text-xs font-bold text-slate-800 truncate">{partnerInfo.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 font-medium">
                {isUpcycle ? "Partner UMKM Terverifikasi" : isRecycle ? "Tempat Recycle Terverifikasi" : "Tempat Donasi Terverifikasi"}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 shadow-sm border border-green-100"
                    : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                }`}
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

        {/* Status legend */}
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Status {isUpcycle ? "Upcycle" : isRecycle ? "Recycle" : "Donasi"}
          </p>
          {[
            { icon: Clock, label: "Menunggu", color: "text-amber-500" },
            { icon: CheckCircle2, label: isService ? "Diproses" : "Diterima", color: "text-green-500" },
            { icon: X, label: "Ditolak", color: "text-red-400" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={14} className={color} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>

        {/* User */}
        <div className="p-4 border-t border-slate-100/50">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-md text-sm">
                {partnerUser?.name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                  {partnerUser?.name || "Partner"}
                </p>
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Partner</p>
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

      {/* Main */}
      <main className="flex-1 lg:ml-72 transition-all duration-300">
        <div className="p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto">{children}</div>
      </main>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
