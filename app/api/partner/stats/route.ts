import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Find the partner profile for this user
    const partner = await prisma.partner.findUnique({
      where: { userId }
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    // Determine types to count based on partner type
    let searchTypes = ["donate", "donasi"];
    if (partner.type === "upcycle" || partner.type === "umkm") {
      searchTypes = ["upcycle", "umkm"];
    } else if (partner.type === "recycle") {
      searchTypes = ["recycle"];
    }

    // 2. Get Statistics (Counts by status)
    const statsRaw = await prisma.transaction.groupBy({
      by: ['status'],
      where: { partnerId: partner.id, type: { in: searchTypes } },
      _count: { id: true }
    });

    const stats = {
      pending: statsRaw.find((s: any) => s.status.toLowerCase() === 'pending')?._count.id || 0,
      confirmed: statsRaw.find((s: any) => s.status.toLowerCase() === 'confirmed' || s.status.toLowerCase() === 'accepted')?._count.id || 0,
      rejected: statsRaw.find((s: any) => s.status.toLowerCase() === 'rejected')?._count.id || 0,
      total: statsRaw.reduce((acc: any, curr: any) => acc + curr._count.id, 0)
    };

    // 3. Get Recent Activity
    const transactions = await prisma.transaction.findMany({
      where: { partnerId: partner.id, type: { in: searchTypes } },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentActivity = await Promise.all(
      transactions.map(async (tx: any) => {
        let itemName = tx.type === "recycle" ? "Barang Recycle" : tx.type === "upcycle" || tx.type === "umkm" ? "Barang Upcycle" : "Barang Donasi";
        if (tx.itemId) {
          const item = await prisma.item.findUnique({ where: { id: tx.itemId } });
          if (item) itemName = item.title;
        }

        return {
          id: tx.id,
          name: itemName,
          user: tx.user?.name || "Donor",
          status: tx.status,
          createdAt: tx.createdAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        partnerInfo: partner,
        stats,
        recentActivity
      }
    });
  } catch (err: any) {
    console.error("Partner stats error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch partner stats" }, { status: 500 });
  }
}
