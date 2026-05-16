const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany();
  console.log('Items:', JSON.stringify(items, null, 2));
  
  const txs = await prisma.transaction.findMany();
  console.log('Transactions:', JSON.stringify(txs, null, 2));

  const sts = await prisma.saleTransaction.findMany();
  console.log('SaleTransactions:', JSON.stringify(sts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
