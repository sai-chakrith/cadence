import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "../../../lib/auth";
import { computeUomScore } from "../../../lib/goal-api";
import { prisma } from "../../../lib/prisma";

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const checkinSchema = z.object({
  goalId: z.string().min(1),
  cycleId: z.string().min(1),
  actual: z.preprocess((value) => toNumber(value), z.number().finite()),
  checkinComment: z.string().optional()
});

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { goalId, cycleId, actual, checkinComment } = parsed.data;
  const trimmedComment = checkinComment ? checkinComment.trim() : "";

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  if (!cycle.checkinWindowOpen) {
    return NextResponse.json({ error: "Check-in window is closed" }, { status: 400 });
  }

  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      cycleId,
      ownerId: user.id,
    },
    include: { cycle: true },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.status === "DRAFT") {
    return NextResponse.json({ error: "Goal must be submitted before check-in" }, { status: 400 });
  }

  const progressScore = computeUomScore(goal.uomType, actual, goal.target, goal.cycle.endDate, new Date());

  const updated = await prisma.$transaction(async (tx) => {
    const savedGoal = await tx.goal.update({
      where: { id: goal.id },
      data: {
        actual,
        progressScore,
      },
    });

    await tx.auditEvent.create({
      data: {
        goalId: goal.id,
        actorId: user.id,
        action: "goal.checkin",
        newValue: trimmedComment || String(actual),
      },
    });

    return savedGoal;
  });

  return NextResponse.json({ goal: updated });
}
