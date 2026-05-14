const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const userId = process.argv[2];
  if (!userId) {
    console.log("Please provide a userId");
    process.exit(1);
  }

  console.log(`--- Checking data for User: ${userId} ---`);

  const latestTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("\nLatest Transactions:");
  latestTransactions.forEach(tx => {
    console.log(`ID: ${tx.id}, Type: ${tx.type}, Status: ${tx.status}, CreatedAt: ${tx.createdAt}`);
  });

  const latestItems = await prisma.item.findMany({
    where: { userId },
    orderBy: { id: 'desc' }, // Assuming ID might be sequential or just take latest
    take: 10
  });

  console.log("\nLatest Items:");
  latestItems.forEach(item => {
    console.log(`ID: ${item.id}, Title: ${item.title}, Status: ${item.status}`);
  });

  process.exit(0);
}

checkData();
