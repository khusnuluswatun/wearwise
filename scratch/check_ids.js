const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany({
    take: 5
  });
  console.log("ITEMS SAMPLE:", JSON.stringify(items, null, 2));
  
  const users = await prisma.user.findMany({
    take: 5
  });
  console.log("USERS SAMPLE:", JSON.stringify(users.map(u => ({ id: u.id, name: u.name })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
