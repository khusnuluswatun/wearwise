import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const price = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0; // strip non-numeric
    const address = formData.get("address") as string;
    
    const file = formData.get("image") as File;
    
    if (!userId || !title || !price || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update user address
    if (address) {
      await prisma.user.update({
        where: { id: userId },
        data: { address }
      });
    }

    // Save image locally
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    const imageUrl = `/uploads/${fileName}`;

    // Create Scan record
    const scan = await prisma.scan.create({
      data: {
        userId,
        imageUrl,
        userChoice: "Sell",
        aiRecommendation: "Sell"
      }
    });

    // Create Item record
    const item = await prisma.item.create({
      data: {
        userId,
        scanId: scan.id,
        title,
        description,
        price,
        status: "available"
      }
    });

    return NextResponse.json({ success: true, item }, { status: 201 });

  } catch (err: any) {
    console.error("Failed to create item:", err);
    return NextResponse.json({ error: err.message || "Failed to save item" }, { status: 500 });
  }
}
