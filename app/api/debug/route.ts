import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
 
export const dynamic = "force-dynamic";

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const scans = await prisma.scan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return NextResponse.json({ transactions, scans });
}
