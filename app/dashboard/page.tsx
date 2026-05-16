"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Heart,
  Recycle,
  ShoppingBag,
  RefreshCcw,
  ChevronDown,
  Star,
  TrendingUp,
  MoreHorizontal,
  ScanLine,
  Store
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Default fallback data
const defaultReportData = [
  { name: "Nov", value: 0 },
  { name: "Dec", value: 0 },
  { name: "Jan", value: 0 },
  { name: "Feb", value: 0 },
  { name: "Mar", value: 0 },
  { name: "Apr", value: 0 },
  { name: "May", value: 0 },
];

const defaultAnalyticsData = [
  { name: "Success", value: 0, color: "#3b82f6" },
  { name: "Pending", value: 0, color: "#fbbf24" },
  { name: "Rejected", value: 0, color: "#f87171" },
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem("user") || localStorage.getItem("partner_user");

        if (userStr) {
          const parsedUser = JSON.parse(userStr);
          setUser(parsedUser);

          // Redirect based on role if they are in the wrong dashboard area
          if (parsedUser.role === "partner") {
            router.replace("/partner/dashboard");
            return; // We are redirecting, but maybe we should still clear loading?
          }
          await fetchDashboardData(parsedUser.id);
        } else {
          router.push("/login");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      const res = await fetch(`/api/dashboard/stats?userId=${userId}&t=${Date.now()}`);
      const result = await res.json();
      if (result.success) {
        setDashboardData((prev: any) => ({
          ...prev,
          stats: result.data?.stats || prev?.stats || {},
          analytics: result.data?.analytics?.length > 0 ? result.data.analytics : prev?.analytics || [],
          recentActivity: result.data?.recentActivity || [],
          reportData: result.data?.reportData?.length > 0 ? result.data.reportData : prev?.reportData || [],
          points: result.data?.rewardPoints ?? prev?.points ?? 0,
          totalTransactions: result.data?.totalTransactions || prev?.totalTransactions || 0,
          growth: result.data?.growth ?? 0,
          successRate: result.data?.successRate ?? 0,
        }));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const stats = [
    { title: "Donation", value: dashboardData?.stats?.donation || "0", icon: Heart, color: "text-blue-500", bg: "bg-blue-100/50" },
    { title: "Recycle", value: (dashboardData?.stats?.recycle ? dashboardData.stats.recycle + "kg" : "0kg"), icon: Recycle, color: "text-amber-500", bg: "bg-amber-100/50" },
    { title: "Di Market", value: dashboardData?.stats?.inMarket || "0", icon: Store, color: "text-emerald-500", bg: "bg-emerald-100/50" },
    { title: "Sold", value: dashboardData?.stats?.sell || "0", icon: ShoppingBag, color: "text-rose-500", bg: "bg-rose-100/50" },
    { title: "Upcycle", value: dashboardData?.stats?.upcycle || "0", icon: RefreshCcw, color: "text-purple-500", bg: "bg-purple-100/50" },
  ];

  const getCategoryStyles = (category: string) => {
    switch (category.toLowerCase()) {
      case "donate": return "bg-green-100 text-green-700";
      case "recycle": return "bg-cyan-100 text-cyan-700";
      case "sell": return "bg-orange-100 text-orange-700";
      case "upcycle": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
      case "approved": return "text-green-500";
      case "pending": return "text-blue-500";
      case "rejected": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  const handleApproveUpcycle = async (txId: string) => {
    try {
      const res = await fetch(`/api/donations/${txId.replace("#", "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // On user side, we don't need partnerId to approve, but the API checks it.
        // Wait, I should make sure the API allows user approval too.
        body: JSON.stringify({ status: "success", role: "user" }),
      });
      if (res.ok) {
        fetchDashboardData(user.id);
      }
    } catch (err) {
      console.error("Failed to approve upcycle:", err);
    }
  };

  return (
    <div className="space-y-6 py-4 px-4 lg:px-8 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-700 rounded-[2rem] p-8 md:p-10 text-white shadow-xl shadow-teal-900/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-emerald-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-3 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || "Eco-warrior"}! 👋
          </h1>
          <p className="text-emerald-50 max-w-lg text-sm md:text-base font-medium leading-relaxed">
            Here's what's happening with your circular fashion journey today. Every action brings us closer to a greener planet!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => router.push('/dashboard/scan')}
            className="bg-white text-teal-700 px-6 py-3 rounded-2xl font-extrabold text-sm shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <ScanLine size={18} strokeWidth={2.5} /> Scan New Item
          </button>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboardData(user?.id);
            }}
            className="bg-teal-800/30 hover:bg-teal-800/50 text-white p-3 rounded-2xl backdrop-blur-md transition-all shadow-sm border border-teal-400/20"
            title="Refresh data"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.title}</p>
              <h3 className="text-xl font-display font-extrabold text-slate-800 leading-none mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid - Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Reports Chart - Enhanced & Flexible Height */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-gradient-to-br from-purple-100/50 to-blue-50/50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
              <div>
                <h2 className="text-xl font-display font-extrabold text-slate-800">Growth & Impact</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Platform activity over the last 7 months</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Live Sync</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-8 mb-8 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Actions</span>
                <span className="text-4xl font-display font-extrabold text-slate-800 tracking-tight">{dashboardData?.totalTransactions || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Est. Growth</span>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-display font-extrabold ${dashboardData?.growth >= 0 ? "text-green-500" : "text-rose-500"}`}>
                    {dashboardData?.growth >= 0 ? "+" : ""}{dashboardData?.growth || 0}%
                  </span>
                  <div className={`${dashboardData?.growth >= 0 ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"} p-1.5 rounded-lg`}>
                    <TrendingUp size={16} strokeWidth={3} className={dashboardData?.growth < 0 ? "rotate-180" : ""} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[250px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.reportData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>


        </div>

        {/* Right Column - Stacked Small Cards */}
        <div className="flex flex-col gap-6">
          {/* Points Card */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between h-full">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative z-10">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">Your Points</h3>
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-amber-400 fill-amber-400 drop-shadow-md" size={36} />
                <span className="text-5xl font-display font-extrabold text-slate-800 tracking-tight">{dashboardData?.points || 0}</span>
              </div>
            </div>

            <div className="relative z-10 w-full mt-auto pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                <span className="text-amber-500">Bronze</span>
                <span>Silver (1000)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, ((dashboardData?.points || 0) / 1000) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Analytics Donut - Compact */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-800">Circular Analytics</h2>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
            </div>

            <div className="relative h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData?.analytics || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                  >
                    {dashboardData?.analytics?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-display font-extrabold text-slate-800">{dashboardData?.successRate || 0}%</span>
                <span className="text-xs font-semibold text-slate-500">Success Rate</span>
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-4">
              {dashboardData?.analytics?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table - Clean & Compact */}
      <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-display font-extrabold text-slate-800">Recent Activity</h2>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="pb-3">Item ID</th>
                <th className="pb-3">Apparel</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Partner</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dashboardData?.recentActivity?.map((item: any, i: number) => (
                <tr
                  key={i}
                  className={`group transition-colors ${item.link ? "cursor-pointer hover:bg-slate-50/80" : ""}`}
                  onClick={() => {
                    if (item.link) {
                      router.push(item.link);
                    }
                  }}
                >
                  <td className="py-3 text-[10px] font-mono font-bold text-slate-300">{item.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <span className="text-base">🧥</span>}
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 truncate max-w-[150px]">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-widest ${getCategoryStyles(item.category)}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-xs font-bold text-slate-600 truncate block max-w-[120px]">{item.place}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col items-center justify-center">
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(item.status)} flex items-center gap-1`}>
                        {item.status}
                        {item.status === "Pending Action" && (
                          <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[7px] animate-pulse">Lanjutkan →</span>
                        )}
                      </span>
                      {item.endDate && item.category.toLowerCase() === "upcycle" && (
                        <span className="text-[8px] font-bold text-slate-400 mt-1 whitespace-nowrap">
                          Est. Selesai: {new Date(item.endDate).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <ShoppingBag size={32} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Activity</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
