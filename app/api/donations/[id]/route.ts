import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// PATCH /api/donations/[id] — partner confirms or rejects a donation transaction
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, partnerId, price, endDate, role, userId: requestUserId } = await req.json();

    if (!["confirmed", "rejected", "completed", "success"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify the transaction
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Auth check
    if (role === "user") {
      // User can only change to 'success' or 'completed' for their own transaction
      if (status !== "success" && status !== "completed") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      // Partner check
      if (transaction.partnerId !== partnerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const data: any = { status };

    if (role !== "user") {
      data.sellerConfirmed = status === "confirmed" || status === "completed" || status === "success";
      if (status === "confirmed") {
        data.startDate = transaction.startDate || new Date();
        if (price) data.price = parseInt(price);
        if (endDate) data.endDate = new Date(endDate);
      }
    } else {
      data.buyerConfirmed = status === "success" || status === "completed";
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
    });

    // Update item status accordingly
    if (transaction.itemId) {
      let itemStatus = "donated";
      if (status === "rejected") itemStatus = "rejected";
      else if (status === "completed" || status === "success") {
        if (transaction.type === "upcycle") itemStatus = "upcycled";
        else if (transaction.type === "recycle") itemStatus = "recycled";
        else itemStatus = "donated_success";
      }

      await prisma.item.update({
        where: { id: transaction.itemId },
        data: { status: itemStatus },
      });
    }

    // AWARD REWARDS on completion
    if ((status === "completed" || status === "success") && transaction.status !== "completed" && transaction.status !== "success") {
      // Points based on type
      let points = 25; // default donation
      if (transaction.type === "upcycle") points = 50;
      else if (transaction.type === "recycle") points = 15;
      
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { rewardPoints: { increment: points } }
      });

      // Record reward history
      await prisma.reward.create({
        data: {
          userId: transaction.userId,
          type: transaction.type,
          points: points
        }
      });
    }

    return NextResponse.json({ success: true, transaction: updated });
  } catch (err: any) {
    console.error("Transaction update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update transaction" }, { status: 500 });
  }
}
