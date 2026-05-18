import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const cycleId = body?.cycleId;
  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
  }

  const draftGoals = await prisma.goal.findMany({
    where: {
      ownerId: user.id,
      cycleId,
      status: "DRAFT",
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const updated = [];
    for (const goal of draftGoals) {
      const saved = await tx.goal.update({
        where: { id: goal.id },
        data: {
          status: "SUBMITTED",
          isLocked: true,
        },
      });
      updated.push(saved);

      await tx.auditEvent.create({
        data: {
          goalId: goal.id,
          actorId: user.id,
          action: "goal.submitted",
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ submitted: result.length });
}
