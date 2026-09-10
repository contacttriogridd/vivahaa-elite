import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPwd = await bcrypt.hash('Admin@123', 12)
  const userPwd = await bcrypt.hash('Demo@123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@vivahaaelite.demo' },
    update: {},
    create: {
      email: 'admin@vivahaaelite.demo',
      password: adminPwd,
      name: 'Admin',
      tier: 'elite',
      plan: 'platinum',
      profileCompletion: 100,
      emailVerified: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'demo@vivahaaelite.demo' },
    update: {},
    create: {
      email: 'demo@vivahaaelite.demo',
      password: userPwd,
      name: 'Demo User',
      tier: 'elite',
      plan: 'gold',
      profileCompletion: 60,
      emailVerified: true,
    },
  })

  console.log('Demo users seeded successfully')
}

main().catch(console.error).finally(() => prisma.$disconnect())
