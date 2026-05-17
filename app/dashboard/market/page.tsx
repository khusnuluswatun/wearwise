import { prisma } from "@/lib/prisma";
import MarketClient from "./MarketClient";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const items = await prisma.item.findMany({
    where: { status: "available" },
    include: { user: true }
  });

  const scans = await prisma.scan.findMany();

  const marketItems = items.map((item: any) => {
    const scan = scans.find((s: any) => s.id === item.scanId);
    let imageUrl = scan?.imageUrl || "/placeholder.png";
    if (imageUrl.startsWith("/uploads/")) {
      imageUrl = `/api${imageUrl}`;
    }
    return {
      ...item,
      imageUrl: imageUrl
    };
  }).reverse();
  
  return <MarketClient items={marketItems} />;
}