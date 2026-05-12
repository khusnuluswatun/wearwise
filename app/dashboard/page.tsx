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

// Mock Data
const reportData = [
  { name: "Nov 2025", value: 55 },
  { name: "Dec 2025", value: 58 },
  { name: "Jan 2026", value: 38 },
  { name: "Feb 2026", value: 77 },
  { name: "Mar 2026", value: 45 },
  { name: "Apr 2026", value: 65 },
  { name: "May 2026", value: 90 },
];

const analyticsData = [
  { name: "Success", value: 80, color: "#3b82f6" },
  { name: "Pending", value: 15, color: "#fbbf24" },
  { name: "Rejected", value: 5, color: "#f87171" },
];

const recentActivity = [
  { id: "#876364", name: "Jaket", category: "Recycle", categoryColor: "bg-cyan-100 text-cyan-700", place: "Lucy Recycle", status: "Waiting", statusColor: "text-blue-500" },
  { id: "#876368", name: "Black Sleep Dress", category: "Donation", categoryColor: "bg-green-100 text-green-700", place: "Panti Asuhan Melati", status: "Success", statusColor: "text-green-500" },
  { id: "#876412", name: "Kemeja", category: "Sell", categoryColor: "bg-orange-100 text-orange-700", place: "Marketplace", status: "Waiting", statusColor: "text-blue-500" },
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user") || localStorage.getItem("partner_user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      
      // Redirect based on role if they are in the wrong dashboard area
      if (parsed.role === "partner") {
        router.replace("/partner/dashboard");
        return;
      }

      fetchDashboardData(parsed.id);
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      const res = await fetch(`/api/dashboard/stats?userId=${userId}&t=${Date.now()}`);
      const result = await res.json();
      if (result.success) {
        setDashboardData(result.data);
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

      {/* Stats Row - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon size={20} strokeWidth={2.5} />
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
                <AreaChart data={dashboardData?.reportData || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
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
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group h-[100px] flex flex-col justify-center">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-50 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700"></div>
            <h3 className="text-[10px] font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Reward Points</h3>
            <div className="flex items-center gap-3 relative z-10">
              <Star className="text-amber-400 fill-amber-400" size={24} />
              <span className="text-3xl font-display font-extrabold text-slate-800 leading-none">{dashboardData?.rewardPoints || 0}</span>
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
                    cx="50%" cy="50%" innerRadius={40} outerRadius={55}
                    paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}
                  >
                    {dashboardData?.analytics.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-xl font-display font-extrabold text-slate-800 leading-none">
                  {dashboardData?.totalTransactions > 0 
                    ? Math.round(((dashboardData?.analytics.find((a: any) => a.name === "Success")?.value || 0) / dashboardData?.totalTransactions) * 100)
                    : 0}%
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Success</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              {dashboardData?.analytics.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[9px] font-bold text-slate-600">{item.name}</span>
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
