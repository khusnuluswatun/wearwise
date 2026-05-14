const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGlobalLatest() {
  console.log("--- Global Latest Transactions ---");
  const txs = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  txs.forEach(tx => {
    console.log(`[${tx.createdAt.toISOString()}] User: ${tx.user.name} (${tx.user.email}), Type: ${tx.type}, Status: ${tx.status}, ID: ${tx.id}`);
  });

  console.log("\n--- Global Latest Items ---");
  const items = await prisma.item.findMany({
    orderBy: { id: 'desc' }, // items might not have createdAt, checking ID
    take: 5,
    include: {
      user: { select: { name: true } }
    }
  });

  items.forEach(item => {
    console.log(`User: ${item.user.name}, Title: ${item.title}, Status: ${item.status}, ID: ${item.id}`);
  });

  process.exit(0);
}

checkGlobalLatest();
