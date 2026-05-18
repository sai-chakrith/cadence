import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const submitSchema = z.object({
  cycleId: z.string().min(1)
});

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { cycleId } = parsed.data;

  const allGoals = await prisma.goal.findMany({
    where: {
      ownerId: user.id,
      cycleId,
    },
  });

  const totalWeightage = allGoals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
  if (Math.abs(totalWeightage - 100) > 0.01) {
    return NextResponse.json({ error: "Total weightage of all goals must equal 100 before submission" }, { status: 400 });
  }

  const draftGoals = allGoals.filter(g => g.status === "DRAFT");
  if (draftGoals.length === 0) {
    return NextResponse.json({ error: "No draft goals found to submit" }, { status: 400 });
  }

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
