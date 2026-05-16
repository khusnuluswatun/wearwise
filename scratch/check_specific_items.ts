import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const ids = ["5608f2c6-e4e5-4cea-829e-4f32433fc494", "f59e7fd2-710b-4d6c-ac18-509ca1915346"];
  const items = await prisma.item.findMany({
    where: { id: { in: ids } }
  });
  console.log("ITEMS IN DB:", JSON.stringify(items, null, 2));
}

main().catch(console.error);
