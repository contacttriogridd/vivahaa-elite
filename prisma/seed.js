import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createEmployeeWithId } from '../server/lib/employeeId.js'
import { createVendorWithId } from '../server/lib/vendorId.js'
import { seedAdminDemo } from './seedAdminDemo.js'

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
      plan: 'PLATINUM',
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
      plan: 'GOLD',
      profileCompletion: 60,
      emailVerified: true,
    },
  })

  console.log('Demo users seeded successfully')

  // Bootstrap HR_ADMIN employee — there's no other way to create the first employee,
  // since every /api/admin employee-management endpoint requires an HR_ADMIN token.
  const hrExists = await prisma.employee.findUnique({ where: { email: 'hr@vivahaaelite.demo' } })
  if (!hrExists) {
    const hrPwd = await bcrypt.hash('HrAdmin@123', 12)
    await createEmployeeWithId(prisma, {
      name: 'HR Admin', email: 'hr@vivahaaelite.demo', password: hrPwd, role: 'HR_ADMIN',
    })
    console.log('Bootstrap HR_ADMIN employee seeded (hr@vivahaaelite.demo)')
  }

  // Demo vendor, for exercising the vendor login portal (Task 6) end to end.
  const vendorExists = await prisma.vendor.findUnique({ where: { email: 'vendor@vivahaaelite.demo' } })
  if (!vendorExists) {
    const vendorPwd = await bcrypt.hash('Vendor@123', 12)
    await createVendorWithId(prisma, {
      name: 'Demo Photography Studio', category: 'Photography', email: 'vendor@vivahaaelite.demo',
      password: vendorPwd, city: 'Coimbatore', tier: 'standard',
    })
    console.log('Demo vendor seeded (vendor@vivahaaelite.demo)')
  }

  await seedAdminDemo(prisma)
}

main().catch(console.error).finally(() => prisma.$disconnect())
