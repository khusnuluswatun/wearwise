import { prisma } from "../lib/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("SUCCESS: Database connected via lib/prisma!");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("SUCCESS: Query successful!", users);
  } catch (err) {
    console.error("FAILURE: Could not connect to database", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
