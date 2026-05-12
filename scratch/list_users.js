const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    take: 10
  });
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

listUsers();
