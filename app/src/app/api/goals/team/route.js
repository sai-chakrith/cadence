import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
  }

  const where = {
    cycleId,
  };

  if (user.role === "MANAGER") {
    where.owner = { managerId: user.id };
  }

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [{ owner: { name: "asc" } }, { createdAt: "asc" }],
    include: {
      owner: true,
      cycle: true,
    },
  });

  return NextResponse.json({ goals });
}
