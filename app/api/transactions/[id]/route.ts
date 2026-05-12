import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, address: true } },
        partner: { select: { id: true, name: true, phone: true, address: true, type: true } },
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    let item = null;
    let imageUrl = null;
    
    if (transaction.itemId) {
      item = await prisma.item.findUnique({ where: { id: transaction.itemId } });
    }
    
    if (transaction.scanId) {
      const scan = await prisma.scan.findUnique({ where: { id: transaction.scanId } });
      imageUrl = scan?.imageUrl || null;
    }

    return NextResponse.json({ 
      success: true, 
      data: { ...transaction, item, imageUrl } 
    });
  } catch (err: any) {
    console.error("Transaction detail fetch error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch transaction" }, { status: 500 });
  }
}
