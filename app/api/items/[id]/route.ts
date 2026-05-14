import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: { user: true, saleTransactions: { include: { buyer: true } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scan = await prisma.scan.findUnique({ where: { id: item.scanId } });
  return NextResponse.json({
    success: true,
    item: { ...item, imageUrl: scan?.imageUrl || "/placeholder.png" },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { description, userId } = body;

    // Verify ownership
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const updated = await prisma.item.update({
      where: { id },
      data: { description },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
