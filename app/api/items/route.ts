import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const existingScanId = formData.get("scanId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const price = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0; // strip non-numeric
    const address = formData.get("address") as string;
    
    const file = formData.get("image") as File;
    
    if (!userId || !title || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update user address
    if (address) {
      await prisma.user.update({
        where: { id: userId },
        data: { address }
      });
    }

    let imageUrl = "";
    let scanId = existingScanId;

    if (existingScanId) {
      const existingScan = await prisma.scan.findUnique({ where: { id: existingScanId } });
      if (existingScan) {
        imageUrl = existingScan.imageUrl;
        // Update user choice
        await prisma.scan.update({
          where: { id: existingScanId },
          data: { userChoice: "Sell" }
        });
      }
    }

    if (!imageUrl && file) {
      // Save image locally
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      imageUrl = `/api/uploads/${fileName}`;

      // Create Scan record
      const scan = await prisma.scan.create({
        data: {
          userId,
          imageUrl,
          userChoice: "Sell",
          aiRecommendation: "Sell"
        }
      });
      scanId = scan.id;
    }

    // Create Item record
    const item = await prisma.item.create({
      data: {
        userId,
        scanId: scanId,
        title,
        description,
        price,
        status: "available"
      }
    });

    // Create Transaction record so it shows up in dashboard activity
    await prisma.transaction.create({
      data: {
        userId,
        itemId: item.id,
        scanId: scanId,
        type: "sell",
        status: "available",
      }
    });

    return NextResponse.json({ success: true, item }, { status: 201 });

  } catch (err: any) {
    console.error("Failed to create item:", err);
    return NextResponse.json({ error: err.message || "Failed to save item" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ success: true, items: [] });
    }

    const items = await prisma.item.findMany({
      where: {
        OR: [
          { userId },
          {
            saleTransactions: {
              some: { buyerId: userId }
            }
          }
        ]
      },
      include: {
        user: { select: { name: true, phone: true, address: true } },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch all related transactions to find notes/rejection reasons
    const itemIds = items.map(i => i.id);
    const transactions = await prisma.transaction.findMany({
      where: { itemId: { in: itemIds } },
      include: { partner: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const scans = await prisma.scan.findMany();
    const itemsWithImages = items.map(item => {
      const scan = scans.find(s => s.id === item.scanId);
      // Get the latest transaction for this item
      const latestTx = transactions.find(t => t.itemId === item.id);

      return {
        ...item,
        imageUrl: scan?.imageUrl || "/placeholder.png",
        latestTransaction: latestTx || null,
        scan: scan || null
      };
    });

    return NextResponse.json({ success: true, items: itemsWithImages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
