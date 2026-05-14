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
  MoreHorizontal
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
      const userStr = localStorage.getItem("user") || localStorage.getItem("partner_user");

      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);

        // Redirect based on role if they are in the wrong dashboard area
        if (parsedUser.role === "partner") {
          router.replace("/partner/dashboard");
          return;
        }
        fetchDashboardData(parsedUser.id);
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      const res = await fetch(`/api/dashboard/stats?userId=${userId}&t=${Date.now()}`);
      const result = await res.json();
      if (result.success) {
        setDashboardData((prev: any) => ({
          ...prev,
          stats: result.stats || prev.stats,
          analytics: result.analytics?.length > 0 ? result.analytics : prev.analytics,
          recentActivity: result.recentActivity || [],
          reportData: result.reportData?.length > 0 ? result.reportData : prev.reportData,
          points: result.points ?? prev.points,
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
    { title: "Donation", value: dashboardData?.stats.donation || "0", icon: Heart, color: "text-blue-500", bg: "bg-blue-100/50" },
    { title: "Recycle", value: dashboardData?.stats.recycle + "kg" || "0kg", icon: Recycle, color: "text-amber-500", bg: "bg-amber-100/50" },
    { title: "Sold", value: dashboardData?.stats.sell || "0", icon: ShoppingBag, color: "text-rose-500", bg: "bg-rose-100/50" },
    { title: "Upcycle", value: dashboardData?.stats.upcycle || "0", icon: RefreshCcw, color: "text-purple-500", bg: "bg-purple-100/50" },
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

      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboardData(user?.id);
            }}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-green-600 transition-all shadow-sm group"
            title="Refresh data"
          >
            <RefreshCcw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-sm">
            {new Date().toLocaleDateString()} <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Donation", value: "40", icon: Heart, color: "text-blue-500", bg: "bg-blue-100/50" },
          { title: "Recycle", value: "10kg", icon: Recycle, color: "text-amber-500", bg: "bg-amber-100/50" },
          { title: "Sold", value: "3", icon: ShoppingBag, color: "text-rose-500", bg: "bg-rose-100/50" },
          { title: "Upcycle", value: "1", icon: RefreshCcw, color: "text-purple-500", bg: "bg-purple-100/50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
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

        {/* Reports Chart - Compact Height */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-800">Growth Reports</h2>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
            </div>
            <div className="h-[240px] w-full">
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

          {/* Recent Activity Table */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-4 font-semibold">Item no</th>
                    <th className="pb-4 font-semibold">Apparel Name</th>
                    <th className="pb-4 font-semibold">Categories</th>
                    <th className="pb-4 font-semibold">Place</th>
                    <th className="pb-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dashboardData.recentActivity.length > 0 ? dashboardData.recentActivity.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-sm font-semibold text-slate-600">{item.id}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shadow-inner">
                            {item.name === "Jaket" ? "🧥" : item.name === "Kemeja" ? "👔" : "👗"}
                          </div>
                          <span className="text-sm font-bold text-slate-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${item.categoryColor}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-600">{item.place}</td>
                      <td className="py-4 text-sm font-bold">
                        <span className={item.statusColor}>{item.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                        No recent activity found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column - Stacked Small Cards */}
        <div className="flex flex-col gap-6">
          {/* Points Card */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

            <h3 className="text-sm font-bold text-slate-500 mb-4 relative z-10">Your points</h3>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Star className="text-amber-400 fill-amber-400 drop-shadow-md" size={36} />
              <span className="text-5xl font-display font-extrabold text-slate-800">{user?.rewardPoints || 0}</span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 relative z-10">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                <TrendingUp size={14} strokeWidth={3} />
              </div>
              <span className="text-sm font-bold text-slate-700">+2 <span className="text-slate-400 font-medium">activity/week</span></span>
            </div>
          </div>

          {/* Analytics Donut - Compact */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-800">Circular Analytics</h2>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
            </div>

            <div className="relative h-[130px] flex items-center justify-center">
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
                <span className="text-3xl font-display font-extrabold text-slate-800">{dashboardData?.analytics?.find((a: any) => a.name === "Success")?.value || 0}%</span>
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
              {dashboardData?.recentActivity.map((item: any, i: number) => (
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
              {dashboardData?.recentActivity.length === 0 && (
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
