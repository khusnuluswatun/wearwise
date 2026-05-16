import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { uploadToSupabase } from "../../../lib/supabase";

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
      // Upload image to Supabase Storage
      imageUrl = await uploadToSupabase(file, "items");

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

    const items = await prisma.item.findMany({
      where: userId ? { userId } : {},
      include: {
        user: true,
      }
    });

    const scans = await prisma.scan.findMany();
    const itemsWithImages = items.map((item: any) => {
      const scan = scans.find((s: any) => s.id === item.scanId);
      return {
        ...item,
        imageUrl: scan?.imageUrl || "/placeholder.png"
      };
    });

    return NextResponse.json({ success: true, items: itemsWithImages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
