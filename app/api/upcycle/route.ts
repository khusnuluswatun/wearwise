import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const partnerId = formData.get("partnerId") as string;
    const deliveryMethod = formData.get("deliveryMethod") as string;
    const pickupAddress = formData.get("pickupAddress") as string;
    const pickupTime = formData.get("pickupTime") as string;
    const startDate = formData.get("startDate") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const notes = formData.get("notes") as string;
    let price = parseInt(formData.get("price") as string || "0");
    if (isNaN(price)) price = 0;
    const type = (formData.get("type") as string) || "upcycle";
    const userChoiceFormatted = type.charAt(0).toUpperCase() + type.slice(1);
    const itemStatus = type === "recycle" ? "recycling_pending" : "upcycling_pending";

    if (!userId || !partnerId) {
      return NextResponse.json({ error: "userId and partnerId are required" }, { status: 400 });
    }

    const itemsJson = formData.get("items") as string;
    const items: { title: string; description: string; fileName: string; scanId: string }[] = JSON.parse(itemsJson || "[]");
    const imageFiles = formData.getAll("images") as File[];

    if (items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const createdTransactions = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const scanId = item.scanId;
      const imageFile = imageFiles[i];

      let imageUrl = "";

      if (scanId) {
        const existingScan = await prisma.scan.findUnique({ where: { id: scanId } });
        if (existingScan) {
          imageUrl = existingScan.imageUrl;
          await prisma.scan.update({
            where: { id: scanId },
            data: { userChoice: userChoiceFormatted }
          });
        }
      }

      if (!imageUrl && imageFile) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const fileName = `${crypto.randomUUID()}-${(item.fileName || "item.jpg").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        imageUrl = `/uploads/${fileName}`;

        const scan = await prisma.scan.create({
          data: { userId, imageUrl, userChoice: userChoiceFormatted, aiRecommendation: userChoiceFormatted },
        });
        // item.scanId = scan.id; // not used since loop continues
      }

      // Create Item
      const newItem = await prisma.item.create({
        data: { 
          userId, 
          scanId: scanId || "", 
          title: item.title, 
          description: item.description, 
          price: price, 
          status: itemStatus 
        },
      });

      // Create Transaction
      const validStartDate = startDate && !isNaN(new Date(startDate).getTime()) ? new Date(startDate) : null;
      const validEndDate = validStartDate ? new Date(validStartDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;

      const tx = await prisma.transaction.create({
        data: {
          userId,
          partnerId,
          itemId: newItem.id,
          scanId: scanId || "manual-entry",
          type: type,
          status: "pending",
          deliveryMethod,
          pickupAddress,
          pickupTime,
          startDate: validStartDate,
          endDate: validEndDate,
          price,
          paymentMethod,
          notes
        },
      });

      createdTransactions.push(tx);
    }

    return NextResponse.json({ success: true, transactions: createdTransactions }, { status: 201 });
  } catch (err: any) {
    console.error("Upcycle submit error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to submit upcycle request",
      details: err.stack
    }, { status: 500 });
  }
}
