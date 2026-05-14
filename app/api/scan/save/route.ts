import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const userChoice = formData.get("userChoice") as string;
    const imageFile = formData.get("image") as File | null;
    const aiRecommendation = formData.get("aiRecommendation") as string;

    if (!userId || !userChoice) {
      return NextResponse.json({ error: "userId and userChoice are required" }, { status: 400 });
    }

    let imageUrl = "";
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = `${crypto.randomUUID()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
    }

    // 1. Create Scan record
    const scan = await prisma.scan.create({
      data: {
        userId,
        imageUrl,
        userChoice,
        aiRecommendation
      }
    });

    // 2. If choice is Recycle, create a final transaction immediately
    if (userChoice.toLowerCase() === "recycle") {
      await prisma.transaction.create({
        data: {
          userId,
          scanId: scan.id,
          type: "recycle",
          status: "completed", // Recycle is usually immediate
        }
      });
    }

    return NextResponse.json({ success: true, scanId: scan.id });
  } catch (err: any) {
    console.error("Failed to save scan:", err);
    return NextResponse.json({ error: err.message || "Failed to save scan" }, { status: 500 });
  }
}
