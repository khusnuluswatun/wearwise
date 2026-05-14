import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("excludeId");

    const users = await prisma.user.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      select: { id: true, name: true, email: true, phone: true, address: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
