import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { createEmployeeWithId } from '../server/lib/employeeId.js'
import { createVendorWithId } from '../server/lib/vendorId.js'
import { seedAdminDemo } from './seedAdminDemo.js'

// The actual seeding logic, factored out so it can run against any PrismaClient
// instance — the CLI entrypoint below (npm run db:seed) creates its own, and
// server/routes/admin.js's temporary production-seed trigger reuses the one
// already created in server/index.js instead of opening a second connection.
export async function seedCore(prisma) {
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

// CLI entrypoint (npm run db:seed) — owns its own PrismaClient and disconnects
// when done, same as before this file was refactored to export seedCore.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const prisma = new PrismaClient()
  seedCore(prisma).catch(console.error).finally(() => prisma.$disconnect())
}
