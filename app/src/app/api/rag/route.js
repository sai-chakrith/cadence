import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { retrieveSimilarEmbeddings } from "../../../lib/rag";

const DAY_MS = 1000 * 60 * 60 * 24;

const toPercent = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

const pickEmployeeFromMessage = async (message) => {
  const employees = await prisma.employee.findMany({
    select: { id: true, name: true }
  });

  const text = message.toLowerCase();
  const exactMatch = employees.find((emp) => text.includes(emp.name.toLowerCase()));
  if (exactMatch) return exactMatch;

  const firstNameMatch = employees.find((emp) => {
    const firstName = emp.name.split(" ")[0].toLowerCase();
    return text.includes(firstName);
  });

  return firstNameMatch || employees[0] || null;
};

const pickDepartmentFromMessage = async (message) => {
  const departments = await prisma.employee.findMany({
    distinct: ["department"],
    select: { department: true }
  });

  const text = message.toLowerCase();
  const match = departments.find((dept) => text.includes(dept.department.toLowerCase()));
  return match?.department || null;
};

const fetchLatestCycle = async () => {
  return prisma.cycle.findFirst({
    orderBy: { startDate: "desc" }
  });
};

const buildCompletionResponse = async (cycle) => {
  const employees = await prisma.employee.findMany({
    where: { role: "EMPLOYEE" },
    include: { goals: { where: { cycleId: cycle.id } } }
  });

  const deptMap = {};
  employees.forEach((emp) => {
    const dept = emp.department || "Unassigned";
    if (!deptMap[dept]) {
      deptMap[dept] = { total: 0, completed: 0 };
    }

    if (!emp.goals || emp.goals.length === 0) return;

    deptMap[dept].total += 1;
    const completed = emp.goals.every((goal) => goal.actual !== null && goal.actual !== undefined);
    if (completed) deptMap[dept].completed += 1;
  });

  const facts = Object.entries(deptMap)
    .map(([dept, stats]) => `${dept} ${toPercent(stats.completed, stats.total)}%`)
    .sort();

  return {
    answer: `Completion by department for ${cycle.name}:`,
    facts: facts.length ? facts : ["No completion data yet."],
  };
};

const buildOverdueResponse = async (cycle, message) => {
  const employees = await prisma.employee.findMany({
    where: { role: "EMPLOYEE" },
    include: { goals: { where: { cycleId: cycle.id } } }
  });

  const now = new Date();
  const daysSinceStart = Math.max(0, Math.ceil((now - cycle.startDate) / DAY_MS));
  const thresholdMatch = message.match(/(\d+)\s*day/);
  const threshold = thresholdMatch ? Number(thresholdMatch[1]) : 5;

  const overdue = employees.filter((emp) => !emp.goals || emp.goals.length === 0);
  const facts = overdue.map((emp) => `${emp.name} - ${daysSinceStart} days`);

  if (daysSinceStart < threshold || facts.length === 0) {
    return {
      answer: `No overdue submissions after ${threshold} days for ${cycle.name}.`,
      facts: []
    };
  }

  return {
    answer: `Overdue submissions (>= ${threshold} days) for ${cycle.name}:`,
    facts
  };
};

const buildAuditResponse = async (cycle, message) => {
  const employee = await pickEmployeeFromMessage(message);
  if (!employee) {
    return {
      answer: "No employee matched that request.",
      facts: []
    };
  }

  const events = await prisma.auditEvent.findMany({
    where: {
      goal: {
        ownerId: employee.id,
        cycleId: cycle.id
      }
    },
    orderBy: { timestamp: "desc" },
    take: 5,
    include: { actor: true, goal: true }
  });

  const facts = events.map((event) => {
    const date = event.timestamp.toISOString().split("T")[0];
    const actor = event.actor?.name || "System";
    const field = event.goal?.title || "Goal";
    const oldValue = event.oldValue || "";
    const newValue = event.newValue || "";
    const change = oldValue || newValue ? `${oldValue} -> ${newValue}` : "";
    return `${date} - ${actor} ${event.action} ${field} ${change}`.trim();
  });

  return {
    answer: `Post-lock changes for ${employee.name}:`,
    facts: facts.length ? facts : ["No audit changes recorded yet."]
  };
};

const buildManagerRatesResponse = async (cycle) => {
  const managers = await prisma.employee.findMany({
    where: { role: "MANAGER" },
    include: {
      directReports: {
        include: { goals: { where: { cycleId: cycle.id } } }
      }
    }
  });

  const facts = managers.map((manager) => {
    const total = manager.directReports.length;
    const completed = manager.directReports.filter((report) => {
      if (!report.goals || report.goals.length === 0) return false;
      return report.goals.every((goal) => goal.actual !== null && goal.actual !== undefined);
    }).length;
    return `${manager.name} ${toPercent(completed, total)}% (${completed}/${total})`;
  });

  return {
    answer: `Manager check-in rates for ${cycle.name}:`,
    facts: facts.length ? facts : ["No manager check-in data yet."]
  };
};

const buildDistributionResponse = async (cycle, message) => {
  const department = await pickDepartmentFromMessage(message);

  const goals = await prisma.goal.findMany({
    where: {
      cycleId: cycle.id,
      ...(department ? { owner: { department } } : {})
    },
    select: { thrustArea: true }
  });

  const distribution = goals.reduce((acc, goal) => {
    const key = goal.thrustArea || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const total = goals.length;
  const facts = Object.entries(distribution).map(([label, count]) => `${label} ${toPercent(count, total)}%`);

  return {
    answer: department
      ? `Goal distribution by thrust area for ${department} (${cycle.name}):`
      : `Goal distribution by thrust area (${cycle.name}):`,
    facts: facts.length ? facts : ["No goals recorded yet."]
  };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message || "";

    if (!message) {
      return NextResponse.json({
        answer: "Please provide a query to analyze.",
        facts: []
      });
    }

    const cycle = await fetchLatestCycle();
    if (!cycle) {
      return NextResponse.json({
        answer: "No active cycle found. Please configure a cycle first.",
        facts: []
      });
    }

    const normalized = message.toLowerCase();

    if (normalized.includes("completion") || normalized.includes("dashboard")) {
      return NextResponse.json(await buildCompletionResponse(cycle));
    }

    if (normalized.includes("overdue") || normalized.includes("not submitted")) {
      return NextResponse.json(await buildOverdueResponse(cycle, normalized));
    }

    if (normalized.includes("audit") || normalized.includes("changed")) {
      return NextResponse.json(await buildAuditResponse(cycle, normalized));
    }

    if (normalized.includes("manager")) {
      return NextResponse.json(await buildManagerRatesResponse(cycle));
    }

    if (normalized.includes("distribution") || normalized.includes("thrust")) {
      return NextResponse.json(await buildDistributionResponse(cycle, normalized));
    }

    const vectorMatches = await retrieveSimilarEmbeddings(message, { topK: 4 });
    if (vectorMatches.length) {
      const facts = vectorMatches.map((match) => {
        const label = match.sourceType === "AUDIT" ? "Audit" : "Goal";
        const snippet = match.content.length > 140
          ? `${match.content.slice(0, 140)}...`
          : match.content;
        return `${label}: ${snippet}`;
      });
      return NextResponse.json({
        answer: "Based on indexed notes:",
        facts
      });
    }

    return NextResponse.json({
      answer: "I can answer completion dashboards, overdue submissions, audit trails, manager check-in rates, goal distribution, and vector search. Try a sample query.",
      facts: []
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process RAG query" },
      { status: 500 }
    );
  }
}
