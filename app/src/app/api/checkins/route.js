import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../../lib/auth";
import { computeUomScore } from "../../../lib/goal-api";
import { prisma } from "../../../lib/prisma";

function parseValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const goalId = body?.goalId;
  const cycleId = body?.cycleId;
  const actual = parseValue(body?.actual);
  const checkinComment = typeof body?.checkinComment === "string" ? body.checkinComment.trim() : "";

  if (!goalId || !cycleId || actual === null) {
    return NextResponse.json({ error: "goalId, actual, and cycleId are required" }, { status: 400 });
  }

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
        newValue: checkinComment || String(actual),
      },
    });

    return savedGoal;
  });

  return NextResponse.json({ goal: updated });
}
