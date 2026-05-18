import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "../../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");
    const daysOverdue = Math.max(0, Number(searchParams.get("daysOverdue") || 0));

    if (!cycleId) {
      return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
    }

    const rows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          e.id,
          e.name,
          e.email,
          e.department,
          COALESCE(DATE_PART('day', NOW() - c."startDate")::int, 0) AS "daysSinceCycleOpened"
        FROM "Employee" e
        CROSS JOIN "Cycle" c
        LEFT JOIN "Goal" g
          ON g."ownerId" = e.id
         AND g."cycleId" = c.id
         AND g.status <> 'DRAFT'
        WHERE c.id = ${cycleId}
          AND e.role = 'EMPLOYEE'
        GROUP BY e.id, c.id
        HAVING COUNT(g.id) = 0
           AND COALESCE(DATE_PART('day', NOW() - c."startDate")::int, 0) >= ${daysOverdue}
        ORDER BY e.department ASC, e.name ASC
      `
    );

    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load missing submissions report" }, { status: 500 });
  }
}
