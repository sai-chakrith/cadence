const { PrismaClient, Role } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing database...')
  await prisma.auditEvent.deleteMany()
  await prisma.goalAssignment.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.checkInComment.deleteMany()
  await prisma.checkInWindow.deleteMany()
  await prisma.cycle.deleteMany()
  await prisma.employee.deleteMany()

  console.log('Seeding demo data...')
  
  const defaultPassword = await bcrypt.hash('password123', 10)

  // 1. Create Admin
  const admin = await prisma.employee.create({
    data: {
      email: 'admin@atomberg.com',
      name: 'System Admin',
      password: defaultPassword,
      department: 'HR',
      role: Role.ADMIN,
    }
  })

  // 2. Create Managers
  const rohanManager = await prisma.employee.create({
    data: {
      email: 'rohan.mehta@atomberg.com',
      name: 'Rohan Mehta',
      password: defaultPassword,
      department: 'Sales',
      role: Role.MANAGER,
    }
  })

  const engManager = await prisma.employee.create({
    data: {
      email: 'sarah.jones@atomberg.com',
      name: 'Sarah Jones',
      password: defaultPassword,
      department: 'Engineering',
      role: Role.MANAGER,
    }
  })

  // 3. Create Employees
  const employees = [
    { name: 'Priya Nair', email: 'priya.nair@atomberg.com', dept: 'Sales', managerId: rohanManager.id },
    { name: 'Amit Patel', email: 'amit.patel@atomberg.com', dept: 'Sales', managerId: rohanManager.id },
    { name: 'Neha Gupta', email: 'neha.gupta@atomberg.com', dept: 'Sales', managerId: rohanManager.id },
    { name: 'Rahul Sharma', email: 'rohan.sharma@atomberg.com', dept: 'Engineering', managerId: engManager.id },
    { name: 'Anjali Desai', email: 'anjali.desai@atomberg.com', dept: 'Engineering', managerId: engManager.id },
    { name: 'Vikram Singh', email: 'vikram.singh@atomberg.com', dept: 'Engineering', managerId: engManager.id },
  ]

  for (const emp of employees) {
    await prisma.employee.create({
      data: {
        email: emp.email,
        name: emp.name,
        password: defaultPassword,
        department: emp.dept,
        role: Role.EMPLOYEE,
        managerId: emp.managerId
      }
    })
  }

  // 4. Create Cycles
  const currentYear = new Date().getFullYear();
  const q1Cycle = await prisma.cycle.create({
    data: {
      name: `Q1 ${currentYear}`,
      startDate: new Date(`${currentYear}-04-01T00:00:00Z`), // Indian Financial Year starts April
      endDate: new Date(`${currentYear}-06-30T23:59:59Z`),
      lockDate: new Date(`${currentYear}-04-15T23:59:59Z`),
    }
  })

  const q2Cycle = await prisma.cycle.create({
    data: {
      name: `Q2 ${currentYear}`,
      startDate: new Date(`${currentYear}-07-01T00:00:00Z`),
      endDate: new Date(`${currentYear}-09-30T23:59:59Z`),
      lockDate: new Date(`${currentYear}-07-15T23:59:59Z`),
    }
  })

  // CheckIn Windows
  await prisma.checkInWindow.create({
    data: {
      cycleId: q1Cycle.id,
      name: 'Q1 Check-in',
      windowStart: new Date(`${currentYear}-07-01T00:00:00Z`),
      windowEnd: new Date(`${currentYear}-07-15T23:59:59Z`)
    }
  })
  
  await prisma.checkInWindow.create({
    data: {
      cycleId: q2Cycle.id,
      name: 'Q2 Check-in',
      windowStart: new Date(`${currentYear}-10-01T00:00:00Z`),
      windowEnd: new Date(`${currentYear}-10-15T23:59:59Z`)
    }
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })