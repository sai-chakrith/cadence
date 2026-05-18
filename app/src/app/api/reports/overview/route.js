import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "../../../../lib/prisma";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    const cycle = cycleId
      ? await prisma.cycle.findUnique({ where: { id: cycleId } })
      : await prisma.cycle.findFirst({ orderBy: { startDate: "desc" } });

    if (!cycle) {
      return NextResponse.json({ departments: [], completionByDept: [], highlights: [], distribution: [], cycle: null });
    }

    const departments = await prisma.$queryRaw(
      Prisma.sql`
        WITH employee_goal_stats AS (
          SELECT
            e.department,
            e.id AS employee_id,
            COUNT(g.id) AS goal_count,
            COUNT(*) FILTER (WHERE g.status <> 'DRAFT') AS submitted_goal_count,
            COUNT(*) FILTER (WHERE g.status = 'APPROVED') AS approved_goal_count,
            COUNT(*) FILTER (WHERE g.progressScore >= 100) AS completed_goal_count,
            COUNT(*) FILTER (WHERE g.status = 'DRAFT') AS draft_goal_count,
            COALESCE(AVG(COALESCE(g.progressScore, 0)), 0) AS avg_completion_pct
          FROM "Employee" e
          LEFT JOIN "Goal" g
            ON g."ownerId" = e.id
           AND g."cycleId" = ${cycle.id}
          WHERE e.role = 'EMPLOYEE'
          GROUP BY e.department, e.id
        )
        SELECT
          department,
          COUNT(*)::int AS "totalEmployees",
          COUNT(*) FILTER (WHERE goal_count > 0 AND submitted_goal_count = goal_count)::int AS submitted,
          COUNT(*) FILTER (WHERE goal_count > 0 AND approved_goal_count = goal_count)::int AS approved,
          COUNT(*) FILTER (WHERE goal_count > 0 AND completed_goal_count = goal_count)::int AS completed,
          COUNT(*) FILTER (WHERE draft_goal_count > 0)::int AS overdue,
          ROUND(AVG(avg_completion_pct)::numeric, 2) AS "avgCompletionPct"
        FROM employee_goal_stats
        GROUP BY department
        ORDER BY department
      `
    );

    const distribution = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          COALESCE("thrustArea", 'Other') AS label,
          ROUND((COUNT(*)::numeric * 100.0) / NULLIF((SELECT COUNT(*) FROM "Goal" WHERE "cycleId" = ${cycle.id}), 0), 2) AS value
        FROM "Goal"
        WHERE "cycleId" = ${cycle.id}
        GROUP BY COALESCE("thrustArea", 'Other')
        ORDER BY value DESC, label ASC
      `
    );

    const completionByDept = departments.map((row) => ({
      dept: row.department,
      rate: toNumber(row.avgCompletionPct),
      totalEmployees: Number(row.totalEmployees || 0),
      completedEmployees: Number(row.completed || 0),
    }));

    const submittedTotal = departments.reduce((sum, row) => sum + Number(row.submitted || 0), 0);
    const approvedTotal = departments.reduce((sum, row) => sum + Number(row.approved || 0), 0);
    const completedTotal = departments.reduce((sum, row) => sum + Number(row.completed || 0), 0);
    const overdueTotal = departments.reduce((sum, row) => sum + Number(row.overdue || 0), 0);
    const employeeTotal = departments.reduce((sum, row) => sum + Number(row.totalEmployees || 0), 0);

    return NextResponse.json({
      cycle: { id: cycle.id, name: cycle.name },
      departments,
      completionByDept,
      highlights: [
        { label: "Submitted", value: `${submittedTotal}/${employeeTotal}`, note: "Employees with full submissions" },
        { label: "Approved", value: `${approvedTotal}`, note: "Goal sheets approved" },
        { label: "Completed", value: `${completedTotal}`, note: "Employees with fully completed goals" },
        { label: "Overdue", value: `${overdueTotal}`, note: "Employees still pending submission" },
      ],
      distribution: distribution.map((row) => ({
        label: row.label,
        value: toNumber(row.value),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load reporting data" }, { status: 500 });
  }
}
