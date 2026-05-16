import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany({ take: 10 });
  console.log("ITEMS:", JSON.stringify(items, null, 2));
}

main().catch(console.error);
