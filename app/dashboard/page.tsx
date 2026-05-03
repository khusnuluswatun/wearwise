"use client";

import { useState, useEffect } from "react";

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

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
            10-06-2021 <ChevronDown size={16} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
            10-10-2021 <ChevronDown size={16} />
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
            <div>
              <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Charts & Tables) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Reports Chart */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Reports</h2>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 8, fill: '#1e293b', stroke: '#fff', strokeWidth: 3 }}
                  />
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
                  {recentActivity.map((item, i) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
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

          {/* Analytics Donut */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-800">Analytics</h2>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
            </div>
            
            <div className="flex-1 relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                  >
                    {analyticsData.map((entry, index) => (
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
                <span className="text-3xl font-display font-extrabold text-slate-800">80%</span>
                <span className="text-xs font-semibold text-slate-500">Transactions</span>
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-4">
              {analyticsData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
