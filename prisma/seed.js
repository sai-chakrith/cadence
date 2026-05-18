/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, Role, GoalStatus, UomType } = require("@prisma/client");
const bcrypt = require("bcryptjs");
/* eslint-enable @typescript-eslint/no-require-imports */

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();

function daysAgo(days) {
  return new Date(now.getTime() - days * DAY);
}

function daysFromNow(days) {
  return new Date(now.getTime() + days * DAY);
}

async function createGoalWithAudit({
  title,
  thrustArea,
  uomType,
  target,
  weightage,
  ownerId,
  cycleId,
  status,
  actual,
  progressScore,
  isShared = false,
  isLocked = false,
  returnComment,
  unlockReason,
  events,
}) {
  const goal = await prisma.goal.create({
    data: {
      title,
      thrustArea,
      uomType,
      target,
      weightage,
      ownerId,
      cycleId,
      status,
      actual,
      progressScore,
      isShared,
      isLocked,
      returnComment,
      unlockReason,
    },
  });

  if (Array.isArray(events) && events.length > 0) {
    for (const event of events) {
      await prisma.auditEvent.create({
        data: {
          goalId: goal.id,
          actorId: event.actorId,
          action: event.action,
          oldValue: event.oldValue || null,
          newValue: event.newValue || null,
          reason: event.reason || null,
          timestamp: event.timestamp || new Date(),
        },
      });
    }
  }

  return goal;
}

async function main() {
  console.log("Resetting demo data...");
  await prisma.auditEvent.deleteMany();
  await prisma.goalAssignment.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.checkInComment.deleteMany();
  await prisma.checkInWindow.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.employee.deleteMany();

  const demoPassword = await bcrypt.hash("demo123", 10);
  const workerPassword = await bcrypt.hash("worker123", 10);

  const admin = await prisma.employee.create({
    data: {
      email: "admin@goalpulse.com",
      name: "System Admin",
      password: demoPassword,
      department: "HR",
      role: Role.ADMIN,
    },
  });

  const salesManager = await prisma.employee.create({
    data: {
      email: "manager@goalpulse.com",
      name: "Rohan Mehta",
      password: demoPassword,
      department: "Sales",
      role: Role.MANAGER,
    },
  });

  const employeeDemo = await prisma.employee.create({
    data: {
      email: "employee@goalpulse.com",
      name: "Priya Nair",
      password: demoPassword,
      department: "Sales",
      role: Role.EMPLOYEE,
      managerId: salesManager.id,
    },
  });

  const salesEmployees = [
    employeeDemo,
    ...(await Promise.all([
      { name: "Amit Patel", email: "amit.patel@goalpulse.com" },
      { name: "Neha Gupta", email: "neha.gupta@goalpulse.com" },
      { name: "Rahul Sharma", email: "rahul.sharma@goalpulse.com" },
      { name: "Anjali Desai", email: "anjali.desai@goalpulse.com" },
      { name: "Vikram Singh", email: "vikram.singh@goalpulse.com" },
      { name: "Karan Joshi", email: "karan.joshi@goalpulse.com" },
      { name: "Meera Iyer", email: "meera.iyer@goalpulse.com" },
    ].map((person) =>
      prisma.employee.create({
        data: {
          email: person.email,
          name: person.name,
          password: workerPassword,
          department: "Sales",
          role: Role.EMPLOYEE,
          managerId: salesManager.id,
        },
      })
    ))),
  ];

  const engineeringEmployees = await Promise.all([
    { name: "Ishaan Rao", email: "ishaan.rao@goalpulse.com" },
    { name: "Sana Khan", email: "sana.khan@goalpulse.com" },
    { name: "Dev Malhotra", email: "dev.malhotra@goalpulse.com" },
    { name: "Pooja Menon", email: "pooja.menon@goalpulse.com" },
    { name: "Arjun Nair", email: "arjun.nair@goalpulse.com" },
    { name: "Riya Bose", email: "riya.bose@goalpulse.com" },
  ].map((person) =>
    prisma.employee.create({
      data: {
        email: person.email,
        name: person.name,
        password: workerPassword,
        department: "Engineering",
        role: Role.EMPLOYEE,
      },
    })
  ));

  const hrEmployees = await Promise.all([
    { name: "Anita Kapoor", email: "anita.kapoor@goalpulse.com" },
    { name: "Farah Ali", email: "farah.ali@goalpulse.com" },
    { name: "Suresh Babu", email: "suresh.babu@goalpulse.com" },
  ].map((person) =>
    prisma.employee.create({
      data: {
        email: person.email,
        name: person.name,
        password: workerPassword,
        department: "HR",
        role: Role.EMPLOYEE,
      },
    })
  ));

  const q1Cycle = await prisma.cycle.create({
    data: {
      name: "Q1-2025",
      startDate: daysAgo(180),
      endDate: daysAgo(150),
      lockDate: daysAgo(165),
      checkinWindowOpen: false,
    },
  });

  const q2Cycle = await prisma.cycle.create({
    data: {
      name: "Q2-2025",
      startDate: daysAgo(4),
      endDate: daysFromNow(86),
      lockDate: daysFromNow(14),
      checkinWindowOpen: true,
    },
  });

  await prisma.checkInWindow.create({
    data: {
      cycleId: q1Cycle.id,
      name: "Q1 Review Window",
      windowStart: daysAgo(145),
      windowEnd: daysAgo(130),
    },
  });

  await prisma.checkInWindow.create({
    data: {
      cycleId: q2Cycle.id,
      name: "Q2 Check-in Window",
      windowStart: daysAgo(1),
      windowEnd: daysFromNow(15),
    },
  });

  const q1People = [salesManager, ...salesEmployees, ...engineeringEmployees, ...hrEmployees];
  for (const person of q1People) {
    await prisma.goal.create({
      data: {
        title: `Q1 Closeout - ${person.name}`,
        thrustArea: person.department === "Sales" ? "Revenue" : person.department,
        uomType: UomType.MIN,
        target: 100,
        weightage: 100,
        ownerId: person.id,
        cycleId: q1Cycle.id,
        status: GoalStatus.APPROVED,
        actual: 100,
        progressScore: 100,
        isLocked: true,
      },
    });
  }

  const q2SalesApproved = salesEmployees.slice(0, 5);
  const q2SalesPending = salesEmployees.slice(5, 8);
  const q2Engineering = engineeringEmployees;
  const q2Hr = hrEmployees;

  const sharedKpi = await prisma.goal.create({
    data: {
      title: "Q2 Revenue Target",
      thrustArea: "Revenue",
      uomType: UomType.MIN,
      target: 1000000,
      weightage: 100,
      ownerId: salesManager.id,
      cycleId: q2Cycle.id,
      status: GoalStatus.APPROVED,
      actual: 1000000,
      progressScore: 100,
      isShared: true,
      isLocked: true,
    },
  });

  await prisma.goalAssignment.createMany({
    data: salesEmployees.map((employee) => ({
      goalId: sharedKpi.id,
      subscriberId: employee.id,
      weightage: 12.5,
    })),
  });

  const approvedSalesGoals = [
    {
      employee: q2SalesApproved[0],
      title: "Expand Pipeline",
      thrustArea: "Revenue",
      target: 100,
      actual: 100,
      weightage: 20,
      sequence: true,
    },
    {
      employee: q2SalesApproved[1],
      title: "Convert Key Accounts",
      thrustArea: "Revenue",
      target: 100,
      actual: 100,
      weightage: 20,
    },
    {
      employee: q2SalesApproved[2],
      title: "Renewal Retention",
      thrustArea: "Customer",
      target: 100,
      actual: 100,
      weightage: 20,
    },
    {
      employee: q2SalesApproved[3],
      title: "Channel Expansion",
      thrustArea: "Growth",
      target: 100,
      actual: 100,
      weightage: 20,
    },
    {
      employee: q2SalesApproved[4],
      title: "Revenue Hygiene",
      thrustArea: "Ops",
      target: 100,
      actual: 100,
      weightage: 20,
    },
  ];

  for (const item of approvedSalesGoals) {
    const goal = await prisma.goal.create({
      data: {
        title: item.title,
        thrustArea: item.thrustArea,
        uomType: UomType.MIN,
        target: item.target,
        weightage: item.weightage,
        ownerId: item.employee.id,
        cycleId: q2Cycle.id,
        status: GoalStatus.APPROVED,
        actual: item.actual,
        progressScore: 100,
        isLocked: true,
      },
    });

    const baseTime = daysAgo(4);
    await prisma.auditEvent.create({
      data: {
        goalId: goal.id,
        actorId: item.employee.id,
        action: "goal.created",
        timestamp: baseTime,
      },
    });

    if (item.sequence) {
      await prisma.auditEvent.createMany({
        data: [
          {
            goalId: goal.id,
            actorId: item.employee.id,
            action: "goal.submitted",
            timestamp: daysAgo(3),
          },
          {
            goalId: goal.id,
            actorId: salesManager.id,
            action: "goal.returned",
            reason: "Please tighten the target articulation.",
            timestamp: daysAgo(2),
          },
          {
            goalId: goal.id,
            actorId: item.employee.id,
            action: "goal.submitted",
            timestamp: daysAgo(1),
          },
          {
            goalId: goal.id,
            actorId: salesManager.id,
            action: "goal.approved",
            timestamp: now,
          },
        ],
      });
    } else {
      await prisma.auditEvent.createMany({
        data: [
          {
            goalId: goal.id,
            actorId: item.employee.id,
            action: "goal.submitted",
            timestamp: daysAgo(2),
          },
          {
            goalId: goal.id,
            actorId: salesManager.id,
            action: "goal.approved",
            timestamp: daysAgo(1),
          },
        ],
      });
    }
  }

  for (const employee of q2SalesPending) {
    const goal = await prisma.goal.create({
      data: {
        title: `Q2 Sales Goal - ${employee.name}`,
        thrustArea: "Revenue",
        uomType: UomType.MIN,
        target: 100,
        weightage: 100,
        ownerId: employee.id,
        cycleId: q2Cycle.id,
        status: GoalStatus.DRAFT,
        actual: null,
        progressScore: null,
        isLocked: false,
      },
    });

    await prisma.auditEvent.create({
      data: {
        goalId: goal.id,
        actorId: employee.id,
        action: "goal.created",
        timestamp: daysAgo(4),
      },
    });
  }

  for (const employee of q2Engineering) {
    const goal = await prisma.goal.create({
      data: {
        title: `Q2 Engineering Goal - ${employee.name}`,
        thrustArea: "Delivery",
        uomType: UomType.MAX,
        target: 5,
        weightage: 100,
        ownerId: employee.id,
        cycleId: q2Cycle.id,
        status: GoalStatus.APPROVED,
        actual: 4,
        progressScore: 100,
        isLocked: true,
      },
    });

    await prisma.auditEvent.createMany({
      data: [
        { goalId: goal.id, actorId: employee.id, action: "goal.created", timestamp: daysAgo(4) },
        { goalId: goal.id, actorId: employee.id, action: "goal.submitted", timestamp: daysAgo(3) },
        { goalId: goal.id, actorId: salesManager.id, action: "goal.approved", timestamp: daysAgo(2) },
      ],
    });
  }

  for (const employee of q2Hr) {
    const goal = await prisma.goal.create({
      data: {
        title: `Q2 HR Goal - ${employee.name}`,
        thrustArea: "People",
        uomType: UomType.ZERO,
        target: 0,
        weightage: 100,
        ownerId: employee.id,
        cycleId: q2Cycle.id,
        status: GoalStatus.APPROVED,
        actual: 0,
        progressScore: 100,
        isLocked: true,
      },
    });

    await prisma.auditEvent.createMany({
      data: [
        { goalId: goal.id, actorId: employee.id, action: "goal.created", timestamp: daysAgo(3) },
        { goalId: goal.id, actorId: employee.id, action: "goal.submitted", timestamp: daysAgo(2) },
        { goalId: goal.id, actorId: admin.id, action: "goal.approved", timestamp: daysAgo(1) },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
