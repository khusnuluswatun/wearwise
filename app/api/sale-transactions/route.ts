import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const itemId = formData.get("itemId") as string;
    const sellerId = formData.get("sellerId") as string;
    const buyerId = formData.get("buyerId") as string;
    const file = formData.get("proof") as File;

    if (!itemId || !sellerId || !buyerId || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify item belongs to seller
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== sellerId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Save proof image
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `proof-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const proofImageUrl = `/uploads/${fileName}`;

    // Create sale transaction (status: pending_verification)
    const transaction = await prisma.saleTransaction.create({
      data: {
        itemId,
        sellerId,
        buyerId,
        proofImageUrl,
        status: "pending_verification",
      },
    });

    // Mark item as pending
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "pending" },
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create sale transaction:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
