import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Get User Points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rewardPoints: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Get Stats (Counts by type)
    const statsRaw = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true }
    });

    const itemStatsRaw = await prisma.item.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true }
    });

    const soldItemsCount = (itemStatsRaw.find((s: any) => s.status === 'sold')?._count.id || 0) + 
                           (itemStatsRaw.find((s: any) => s.status === 'pending')?._count.id || 0);
    const inMarketItemsCount = itemStatsRaw.find((s: any) => s.status === 'available')?._count.id || 0;

    const sellCountRaw = statsRaw.find((s: any) => s.type.toLowerCase() === 'sell')?._count.id || 0;
    const saleTxCount = await prisma.saleTransaction.count({ where: { sellerId: userId } });

    const stats = {
      donation: statsRaw.find((s: any) => s.type.toLowerCase() === 'donate' || s.type.toLowerCase() === 'donasi')?._count.id || 0,
      recycle: statsRaw.find((s: any) => s.type.toLowerCase() === 'recycle')?._count.id || 0,
      sell: sellCountRaw + saleTxCount,
      upcycle: statsRaw.find((s: any) => s.type.toLowerCase() === 'upcycle')?._count.id || 0,
    };

    // 3. Get Recent Activity (Merged from Transactions and Scans with choices)
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const saleTransactions = await prisma.saleTransaction.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { item: true }
    });

    const recentScans = await prisma.scan.findMany({
      where: { 
        userId,
        userChoice: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const transactedScanIdsRaw = await prisma.transaction.findMany({
      where: { userId, scanId: { not: null } },
      select: { scanId: true }
    });
    // Filter out nulls and normalize to strings
    const transactedScanIds = new Set(
      transactedScanIdsRaw
        .map((tx: any) => tx.scanId)
        .filter((id: any) => id !== null && id !== undefined)
        .map((id: any) => String(id).trim())
    );

    // Fetch details for each transaction
    const transactionActivities = await Promise.all(
      transactions.map(async (tx: any) => {
        let itemName = "Item";
        if (tx.itemId) {
          const item = await prisma.item.findUnique({ where: { id: tx.itemId } });
          if (item) itemName = item.title;
        }

        let place = "Processing";
        if (tx.partnerId) {
          const partner = await prisma.partner.findUnique({ where: { id: tx.partnerId } });
          if (partner) place = partner.name;
        } else if (tx.type.toLowerCase() === 'sell') {
          place = "Marketplace";
        }

        let imageUrl = null;
        if (tx.scanId) {
          const scan = await prisma.scan.findUnique({ where: { id: tx.scanId } });
          if (scan) imageUrl = scan.imageUrl;
        }
        
        if (imageUrl && imageUrl.startsWith("/uploads/")) {
          imageUrl = `/api${imageUrl}`;
        }

        return {
          id: `#${tx.id.substring(0, 6)}`,
          realId: tx.id,
          name: itemName,
          category: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
          place: place,
          status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
          imageUrl: imageUrl,
          createdAt: tx.createdAt,
          endDate: tx.endDate,
          paymentMethod: tx.paymentMethod,
          isTransaction: true,
          link: `/dashboard/transactions/${tx.id}`
        };
      })
    );

    const saleActivities = await Promise.all(saleTransactions.map(async (tx: any) => {
      let imageUrl = tx.proofImageUrl;
      if (tx.item?.scanId) {
        const scan = await prisma.scan.findUnique({ where: { id: tx.item.scanId } });
        if (scan) imageUrl = scan.imageUrl;
      }
      
      if (imageUrl && imageUrl.startsWith("/uploads/")) {
        imageUrl = `/api${imageUrl}`;
      }

      return {
        id: `#${tx.id.substring(0, 6)}`,
        realId: tx.id,
        name: tx.item?.title || "Sold Item",
        category: "Sell",
        place: "Marketplace",
        status: tx.status === "verified" ? "Success" : tx.status === "pending_verification" ? "Pending" : tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
        imageUrl: imageUrl,
        createdAt: tx.createdAt,
        endDate: tx.verifiedAt,
        paymentMethod: "N/A",
        isTransaction: true,
        link: `/dashboard/my-market/${tx.itemId}`
      };
    }));

    // Add scans that haven't become transactions yet
    const scanActivities = recentScans
      .filter((scan: any) => !transactedScanIds.has(String(scan.id).trim()))
      .map((scan: any) => {
        let link = `/dashboard/scan`;
        if (scan.userChoice === "Donate") link = `/dashboard/donate/new?scanId=${scan.id}`;
        else if (scan.userChoice === "Sell") link = `/dashboard/my-market/new?scanId=${scan.id}`;
        else if (scan.userChoice === "Upcycle") link = `/dashboard/upcycle/new?scanId=${scan.id}`;
        else if (scan.userChoice === "Recycle") link = `/dashboard/recycle/new?scanId=${scan.id}`;

        let imageUrl = scan.imageUrl;
        if (imageUrl && imageUrl.startsWith("/uploads/")) {
          imageUrl = `/api${imageUrl}`;
        }

        return {
          id: `#${scan.id.substring(0, 6)}`,
          realId: scan.id,
          name: "Scanned Item",
          category: scan.userChoice || "Scan",
          place: "Selection Phase",
          status: "Pending Action",
          imageUrl: imageUrl,
          createdAt: scan.createdAt,
          isTransaction: false,
          link: link
        };
      });

    // Remove duplicates from transactionActivities if they are already in saleActivities
    const saleItemIds = new Set(saleTransactions.map((st: any) => st.itemId));
    const filteredTransactionActivities = transactionActivities.filter((tx: any) => {
      const relatedTx = transactions.find((t: any) => t.id === tx.realId);
      if (tx.category.toLowerCase() === 'sell' && relatedTx?.itemId && saleItemIds.has(relatedTx.itemId)) {
        return false; // Skip because it's already in saleActivities
      }
      return true;
    });

    // Merge and sort
    const recentActivity = [...filteredTransactionActivities, ...saleActivities, ...scanActivities]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Limit to 5 items as requested

    
    // 4. Get Analytics (Counts by status)
    const analyticsRaw = await prisma.transaction.groupBy({
      by: ['status'],
      where: { 
        userId,
        type: { not: 'sell' }
      },
      _count: { id: true }
    });

    const saleAnalyticsRaw = await prisma.saleTransaction.groupBy({
      by: ['status'],
      where: { sellerId: userId },
      _count: { id: true }
    });

    const txSuccessCount = (analyticsRaw.find((s: any) => s.status.toLowerCase() === 'success')?._count.id || 0) + 
                           (analyticsRaw.find((s: any) => s.status.toLowerCase() === 'completed')?._count.id || 0);
    const saleSuccessCount = saleAnalyticsRaw.find((s: any) => s.status.toLowerCase() === 'verified')?._count.id || 0;
    
    const txPendingCount = (analyticsRaw.find((s: any) => s.status.toLowerCase() === 'pending')?._count.id || 0) + 
                           (analyticsRaw.find((s: any) => s.status.toLowerCase() === 'confirmed')?._count.id || 0) + 
                           (analyticsRaw.find((s: any) => s.status.toLowerCase() === 'available')?._count.id || 0);
    const salePendingCount = saleAnalyticsRaw.find((s: any) => s.status.toLowerCase() === 'pending_verification')?._count.id || 0;
    
    const txRejectedCount = analyticsRaw.find((s: any) => s.status.toLowerCase() === 'rejected')?._count.id || 0;
    const saleRejectedCount = saleAnalyticsRaw.find((s: any) => s.status.toLowerCase() === 'rejected')?._count.id || 0;

    const totalTransactions = txSuccessCount + saleSuccessCount + txPendingCount + salePendingCount + txRejectedCount + saleRejectedCount;

    const analytics = [
      { name: "Success", value: txSuccessCount + saleSuccessCount, color: "#3b82f6" },
      { name: "Pending", value: txPendingCount + salePendingCount, color: "#fbbf24" },
      { name: "Rejected", value: txRejectedCount + saleRejectedCount, color: "#f87171" },
    ];


    // 5. Get Report Data (Last 7 months)
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 6);
    
    const reportRaw = await prisma.transaction.findMany({
      where: {
        userId,
        type: { not: 'sell' },
        createdAt: { gte: sevenMonthsAgo }
      },
      select: { createdAt: true }
    });

    const saleReportRaw = await prisma.saleTransaction.findMany({
      where: {
        sellerId: userId,
        createdAt: { gte: sevenMonthsAgo }
      },
      select: { createdAt: true }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const reportMap: Record<string, number> = {};

    // Initialize last 7 months
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      reportMap[key] = 0;
    }

    reportRaw.forEach((tx: any) => {
      const d = new Date(tx.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (reportMap[key] !== undefined) {
        reportMap[key]++;
      }
    });

    const reportData = Object.keys(reportMap)
      .map((key: any) => ({ name: key, value: reportMap[key] }))
      .reverse();

    // 6. Calculate Growth (Current month vs Previous month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthCount = await prisma.transaction.count({
      where: { 
        userId, 
        type: { not: 'sell' },
        createdAt: { gte: currentMonthStart } 
      }
    });
    const currentMonthSaleCount = await prisma.saleTransaction.count({
      where: { sellerId: userId, createdAt: { gte: currentMonthStart } }
    });

    const prevMonthCount = await prisma.transaction.count({
      where: { 
        userId, 
        type: { not: 'sell' },
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd } 
      }
    });
    const prevMonthSaleCount = await prisma.saleTransaction.count({
      where: { sellerId: userId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }
    });

    const totalCurrentMonth = currentMonthCount + currentMonthSaleCount;
    const totalPrevMonth = prevMonthCount + prevMonthSaleCount;

    let growth = 0;
    if (totalPrevMonth > 0) {
      growth = Math.round(((totalCurrentMonth - totalPrevMonth) / totalPrevMonth) * 100);
    } else if (totalCurrentMonth > 0) {
      growth = 100; // First month growth
    }

    // Success rate calculation for display
    const successRate = totalTransactions > 0 ? Math.round(((txSuccessCount + saleSuccessCount) / totalTransactions) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        rewardPoints: user.rewardPoints,
        stats,
        recentActivity,
        analytics,
        reportData,
        totalTransactions,
        growth,
        successRate
      }
    });
  } catch (err: any) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
