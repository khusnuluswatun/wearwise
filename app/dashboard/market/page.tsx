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
    return {
      ...item,
      imageUrl: scan?.imageUrl || "/placeholder.png"
    };
  }).reverse();
  
  return <MarketClient items={marketItems} />;
}
