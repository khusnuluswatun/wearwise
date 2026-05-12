import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as dotenv from 'dotenv'

dotenv.config()

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error("DATABASE_URL is not set")
const adapter = new PrismaMariaDb(dbUrl)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Check if we already have partners to avoid duplicates
  /*
  if (existingPartners > 0) {
    console.log('Database already seeded with partners.')
    return
  }
  */

  // Create a dummy user first because partner requires a userId
  const dummyUser = await prisma.user.upsert({
    where: { email: 'admin@wearwise.com' },
    update: {},
    create: {
      name: 'WearWise Admin',
      email: 'admin@wearwise.com',
      password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
      phone: '081234567890',
      address: 'Jakarta',
      role: 'admin',
    },
  })

  // We need distinct user IDs for each partner due to the @unique constraint on userId
  // So we'll create a few dummy partner accounts
  const dummyUser1 = await prisma.user.upsert({
    where: { email: 'partner1@wearwise.com' },
    update: {},
    create: {
      name: 'Panti Asuhan Kasih Bunda',
      email: 'partner1@wearwise.com',
      password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
      phone: '08111111111',
      address: 'Jl. Sudirman No. 1, Jakarta',
      role: 'partner',
    },
  })

  const dummyUser2 = await prisma.user.upsert({
    where: { email: 'partner2@wearwise.com' },
    update: {},
    create: {
      name: 'Yayasan Baju Bekas',
      email: 'partner2@wearwise.com',
      password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
      phone: '08222222222',
      address: 'Bandung',
      role: 'partner',
    },
  })

  const dummyUser3 = await prisma.user.upsert({
    where: { email: 'partner3@wearwise.com' },
    update: {},
    create: {
      name: 'Donasi Baju Surabaya',
      email: 'partner3@wearwise.com',
      password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
      phone: '08333333333',
      address: 'Surabaya',
      role: 'partner',
    },
  })

  const dummyUser4 = await prisma.user.upsert({
    where: { email: 'partner4@wearwise.com' },
    update: {},
    create: {
      name: 'Panti Asuhan Depok',
      email: 'partner4@wearwise.com',
      password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
      phone: '08444444444',
      address: 'Margonda Raya, Depok',
      role: 'partner',
    },
  })


  const partnersData = [
    {
      userId: dummyUser1.id,
      type: 'donasi',
      name: 'Panti Asuhan Kasih Bunda',
      description: 'Menerima donasi pakaian layak pakai untuk anak-anak dan dewasa.',
      address: 'Monumen Nasional, Jakarta', // Using known landmarks for easy geocoding
      phone: '08111111111',
      latitude: -6.1753924,
      longitude: 106.8271528,
    },
    {
      userId: dummyUser2.id,
      type: 'donasi',
      name: 'Yayasan Baju Bekas Bandung',
      description: 'Donasi untuk masyarakat kurang mampu di daerah Jawa Barat.',
      address: 'Gedung Sate, Bandung',
      phone: '08222222222',
      latitude: -6.9024812,
      longitude: 107.61881,
    },
    {
      userId: dummyUser3.id,
      type: 'donasi',
      name: 'Pusat Donasi Pakaian Surabaya',
      description: 'Menyalurkan pakaian untuk korban bencana.',
      address: 'Tugu Pahlawan, Surabaya',
      phone: '08333333333',
      latitude: -7.2458428,
      longitude: 112.7378039,
    },
    {
      userId: dummyUser4.id,
      type: 'donasi',
      name: 'Panti Asuhan Depok Terpadu',
      description: 'Pusat penampungan baju bekas layak pakai area Depok.',
      address: 'Universitas Indonesia, Depok',
      phone: '08444444444',
      latitude: -6.360623,
      longitude: 106.827282,
    }
  ]

  console.log(`Start seeding ...`)
  for (const p of partnersData) {
    const partner = await prisma.partner.upsert({
      where: { userId: p.userId },
      update: p,
      create: p,
    })
    console.log(`Created/Updated partner with id: ${partner.id}`)
  }
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
