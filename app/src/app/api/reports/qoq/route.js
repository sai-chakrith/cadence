import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          e.department AS department,
          c.name AS cycle,
          ROUND(AVG(COALESCE(g."progressScore", 0))::numeric, 2) AS "completionRate"
        FROM "Goal" g
        INNER JOIN "Employee" e ON e.id = g."ownerId"
        INNER JOIN "Cycle" c ON c.id = g."cycleId"
        GROUP BY e.department, c.name, c."startDate"
        ORDER BY c."startDate" ASC, e.department ASC
      `
    );

    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load QoQ report" }, { status: 500 });
  }
}
