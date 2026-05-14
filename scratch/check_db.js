const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('--- Recent Transactions ---');
  transactions.forEach(tx => {
    console.log(`ID: ${tx.id}, Type: ${tx.type}, Status: ${tx.status}, ScanID: ${tx.scanId}, CreatedAt: ${tx.createdAt}`);
  });

  const scans = await prisma.scan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('\n--- Recent Scans ---');
  scans.forEach(s => {
    console.log(`ID: ${s.id}, UserChoice: ${s.userChoice}, Image: ${s.imageUrl}, CreatedAt: ${s.createdAt}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
