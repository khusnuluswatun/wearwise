import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Stats
    const donationsCount = await prisma.transaction.count({
      where: { userId, type: { equals: "donation" } } // MySQL is case-insensitive by default in Prisma for equals, but we use exact match just in case
    });
    
    const recycleCount = await prisma.transaction.count({
      where: { userId, type: { equals: "recycle" } }
    });

    const upcycleCount = await prisma.transaction.count({
      where: { userId, type: { equals: "upcycle" } }
    });

    const soldCount = await prisma.saleTransaction.count({
      where: { sellerId: userId, status: "verified" }
    });

    // 2. Analytics
    const normalTx = await prisma.transaction.findMany({ where: { userId }, select: { status: true } });
    const saleTx = await prisma.saleTransaction.findMany({ where: { sellerId: userId }, select: { status: true } });
    
    let success = 0, pending = 0, rejected = 0;
    
    [...normalTx, ...saleTx].forEach(tx => {
      const s = tx.status.toLowerCase();
      if (s.includes("success") || s.includes("completed") || s === "verified") success++;
      else if (s.includes("reject")) rejected++;
      else pending++;
    });

    const total = success + pending + rejected || 1;
    const analyticsData = [
      { name: "Success", value: Math.round((success/total)*100), color: "#3b82f6" },
      { name: "Pending", value: Math.round((pending/total)*100), color: "#fbbf24" },
      { name: "Rejected", value: Math.round((rejected/total)*100), color: "#f87171" },
    ];

    // 3. Recent Activity
    // Fetch normal transactions
    const rawNormalTx = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { partner: true }
    });

    // Map normal tx
    const recentNormalP = rawNormalTx.map(async (tx) => {
      let itemName = "Apparel";
      if (tx.itemId) {
        const item = await prisma.item.findUnique({ where: { id: tx.itemId } });
        if (item) itemName = item.title;
      } else if (tx.scanId) {
        const scan = await prisma.scan.findUnique({ where: { id: tx.scanId } });
        if (scan?.aiDescription) {
          try {
            const data = JSON.parse(scan.aiDescription);
            if (data.item) itemName = data.item;
          } catch(e) {}
        }
      }

      const typeLower = tx.type.toLowerCase();
      let categoryColor = "bg-slate-100 text-slate-700";
      if (typeLower === "recycle") categoryColor = "bg-cyan-100 text-cyan-700";
      else if (typeLower === "donation") categoryColor = "bg-green-100 text-green-700";
      else if (typeLower === "upcycle") categoryColor = "bg-purple-100 text-purple-700";

      const statusLower = tx.status.toLowerCase();
      let statusColor = "text-blue-500";
      if (statusLower.includes("success") || statusLower.includes("completed")) statusColor = "text-green-500";
      else if (statusLower.includes("reject")) statusColor = "text-red-500";

      return {
        id: "#" + tx.id.substring(0, 6).toUpperCase(),
        name: itemName,
        category: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
        categoryColor,
        place: tx.partner?.name || "Partner",
        status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
        statusColor,
        createdAt: tx.createdAt
      };
    });

    // Fetch sale transactions
    const rawSaleTx = await prisma.saleTransaction.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { item: true, buyer: true }
    });

    const recentSale = rawSaleTx.map(tx => {
      let statusColor = "text-blue-500";
      let displayStatus = "Waiting";
      if (tx.status === "verified") {
        statusColor = "text-green-500";
        displayStatus = "Success";
      } else if (tx.status === "rejected") {
        statusColor = "text-red-500";
        displayStatus = "Rejected";
      }

      return {
        id: "#" + tx.id.substring(0, 6).toUpperCase(),
        name: tx.item.title,
        category: "Sell",
        categoryColor: "bg-orange-100 text-orange-700",
        place: "Marketplace",
        status: displayStatus,
        statusColor,
        createdAt: tx.createdAt
      };
    });

    const recentNormal = await Promise.all(recentNormalP);
    
    // Combine and sort
    const recentActivity = [...recentNormal, ...recentSale]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(({ createdAt, ...rest }) => rest);

    // Get current user points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rewardPoints: true }
    });
    const points = user?.rewardPoints || 0;

    // 4. Reports Data (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentNormalAll = await prisma.transaction.findMany({
      where: { userId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    const recentSaleAll = await prisma.saleTransaction.findMany({
      where: { sellerId: userId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    const allTx = [...recentNormalAll, ...recentSaleAll];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const reportMap = new Map();

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = monthNames[d.getMonth()];
      reportMap.set(monthStr, 0);
    }

    allTx.forEach(tx => {
      const monthStr = monthNames[tx.createdAt.getMonth()];
      if (reportMap.has(monthStr)) {
        reportMap.set(monthStr, reportMap.get(monthStr) + 1);
      }
    });

    const reportData = Array.from(reportMap.entries()).map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      success: true,
      points,
      stats: {
        donations: donationsCount,
        recycle: recycleCount,
        upcycle: upcycleCount,
        sold: soldCount
      },
      analytics: analyticsData,
      recentActivity,
      reportData
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
