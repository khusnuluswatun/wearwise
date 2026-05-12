import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// POST /api/donations — user submits donation items to a partner
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const partnerId = formData.get("partnerId") as string;
    const deliveryMethod = formData.get("deliveryMethod") as string;
    const pickupAddress = formData.get("pickupAddress") as string;
    const pickupTime = formData.get("pickupTime") as string;

    if (!userId || !partnerId) {
      return NextResponse.json({ error: "userId and partnerId are required" }, { status: 400 });
    }

    // Items come as JSON string in formData
    const itemsJson = formData.get("items") as string;
    const items: { title: string; description: string; fileName: string }[] = JSON.parse(itemsJson || "[]");
    const imageFiles = formData.getAll("images") as File[];

    if (items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Update user address if provided
    if (pickupAddress && deliveryMethod === "pickup") {
      await prisma.user.update({ where: { id: userId }, data: { address: pickupAddress } });
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const createdTransactions = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const existingScanId = (item as any).scanId;
      const imageFile = imageFiles[i];

      let imageUrl = "";
      let scanId = existingScanId;

      if (existingScanId) {
        // Use existing scan
        const existingScan = await prisma.scan.findUnique({ where: { id: existingScanId } });
        if (existingScan) {
          imageUrl = existingScan.imageUrl;
          // Update user choice just in case
          await prisma.scan.update({
            where: { id: existingScanId },
            data: { userChoice: "Donate" }
          });
        }
      }

      // If no existing scan or scan not found, create new one (fallback)
      if (!imageUrl && imageFile) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const fileName = `${crypto.randomUUID()}-${(item.fileName || "item.jpg").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        imageUrl = `/uploads/${fileName}`;

        const scan = await prisma.scan.create({
          data: { userId, imageUrl, userChoice: "Donate", aiRecommendation: "Donate" },
        });
        scanId = scan.id;
      }

      // Create Item
      const newItem = await prisma.item.create({
        data: { userId, scanId: scanId, title: item.title, description: item.description, price: 0, status: "donated_pending" },
      });

      // Create Transaction
      const tx = await prisma.transaction.create({
        data: {
          userId,
          partnerId,
          itemId: newItem.id,
          scanId: scanId,
          type: "donasi",
          status: "pending",
          deliveryMethod,
          pickupAddress,
          pickupTime,
        },
      });

      createdTransactions.push(tx);
    }

    return NextResponse.json({ success: true, transactions: createdTransactions }, { status: 201 });
  } catch (err: any) {
    console.error("Donation submit error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit donation" }, { status: 500 });
  }
}

// GET /api/donations?partnerId=xxx — get all donation transactions for a partner
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const status = searchParams.get("status"); // optional filter

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const where: any = { partnerId, type: "donasi" };
    if (status) where.status = status;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true } },
        partner: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch item data separately since Transaction.item relation doesn't exist in schema
    const txWithItems = await Promise.all(
      transactions.map(async (tx) => {
        let item = null;
        if (tx.itemId) {
          item = await prisma.item.findUnique({ where: { id: tx.itemId } });
          // Also find scan for image
          let scan = null;
          if (tx.scanId) {
            scan = await prisma.scan.findUnique({ where: { id: tx.scanId } });
          }
          return { ...tx, item, imageUrl: scan?.imageUrl || null };
        }
        return { ...tx, item, imageUrl: null };
      })
    );

    return NextResponse.json({ success: true, data: txWithItems });
  } catch (err: any) {
    console.error("Donation fetch error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch donations" }, { status: 500 });
  }
}
