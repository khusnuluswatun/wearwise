import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { address: true, name: true, phone: true } // only return necessary fields
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch user:", err);
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}
