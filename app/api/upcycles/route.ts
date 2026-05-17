import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, partnerId, itemId, scanId } = await req.json();

    if (!userId || !partnerId) {
      return NextResponse.json({ error: "userId and partnerId are required" }, { status: 400 });
    }

    // Create Transaction for Upcycle
    const tx = await prisma.transaction.create({
      data: {
        userId,
        partnerId,
        itemId,
        scanId,
        type: "upcycle",
        status: "pending", // initial status
      },
    });

    // Update item status
    if (itemId) {
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "upcycle_pending" },
      });
    }

    return NextResponse.json({ success: true, transaction: tx }, { status: 201 });
  } catch (err: any) {
    console.error("Upcycle submit error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit upcycle request" }, { status: 500 });
  }
}

// GET /api/upcycles?partnerId=xxx — get all upcycle requests for a UMKM
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const status = searchParams.get("status");

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    const partnerType = partner?.type === "recycle" ? "recycle" : "upcycle";

    const where: any = { partnerId, type: partnerType };
    if (status) where.status = status;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: { select: { name: true, phone: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch items manually
    const txWithItems = await Promise.all(
      transactions.map(async (tx: any) => {
        let item = null;
        if (tx.itemId) {
          item = await prisma.item.findUnique({ where: { id: tx.itemId } });
          const scan = tx.scanId ? await prisma.scan.findUnique({ where: { id: tx.scanId } }) : null;
          return { ...tx, item, imageUrl: scan?.imageUrl || null };
        }
        return { ...tx, item, imageUrl: null };
      })
    );

    return NextResponse.json({ success: true, data: txWithItems });
  } catch (err: any) {
    console.error("Upcycle fetch error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch upcycle requests" }, { status: 500 });
  }
}
