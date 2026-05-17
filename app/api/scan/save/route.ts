import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToSupabase } from "@/lib/supabase";

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
      imageUrl = await uploadToSupabase(imageFile, "scans");
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


    return NextResponse.json({ success: true, scanId: scan.id });
  } catch (err: any) {
    console.error("Failed to save scan:", err);
    return NextResponse.json({ error: err.message || "Failed to save scan" }, { status: 500 });
  }
}
