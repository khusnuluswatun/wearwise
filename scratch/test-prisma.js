const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaMariaDb('mysql://studia:12qwaszx@127.0.0.1:3306/wearwise');
const prisma = new PrismaClient({ adapter });

prisma.user.findMany({ take: 1 })
  .then(r => { 
    console.log('Success! Records:', r.length); 
    return prisma.$disconnect(); 
  })
  .catch(err => { 
    console.error('Error:', err.message); 
    return prisma.$disconnect(); 
  });
