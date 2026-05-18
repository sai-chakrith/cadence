import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

function clearText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureEmployee(session) {
  if (!session?.user?.id) return null;
  return session.user;
}

async function getCycleOrNull(cycleId) {
  if (!cycleId) return null;
  return prisma.cycle.findUnique({ where: { id: cycleId } });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const user = ensureEmployee(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
  }

  const goals = await prisma.goal.findMany({
    where: {
      cycleId,
      ownerId: user.id,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const user = ensureEmployee(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can create goals" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = clearText(body?.title);
  const thrustArea = clearText(body?.thrustArea);
  const uomType = clearText(body?.uomType).toUpperCase();
  const cycleId = clearText(body?.cycleId);
  const target = Number(body?.target);
  const weightage = Number(body?.weightage);

  if (!title || !thrustArea || !cycleId || !uomType) {
    return NextResponse.json({ error: "title, thrustArea, uomType, target, weightage, and cycleId are required" }, { status: 400 });
  }

  if (!["MIN", "MAX", "TIMELINE", "ZERO"].includes(uomType)) {
    return NextResponse.json({ error: "uomType must be one of MIN, MAX, TIMELINE, ZERO" }, { status: 400 });
  }

  if (!Number.isFinite(target) || !Number.isFinite(weightage)) {
    return NextResponse.json({ error: "target and weightage must be valid numbers" }, { status: 400 });
  }

  if (weightage < 10) {
    return NextResponse.json({ error: "Each goal must have at least 10 weightage" }, { status: 400 });
  }

  const cycle = await getCycleOrNull(cycleId);
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  const existingGoals = await prisma.goal.findMany({
    where: {
      ownerId: user.id,
      cycleId,
    },
    select: { weightage: true },
  });

  if (existingGoals.length >= 8) {
    return NextResponse.json({ error: "Maximum 8 goals per employee" }, { status: 400 });
  }

  const totalWeightage = existingGoals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0) + weightage;
  if (Math.abs(totalWeightage - 100) > 0.01) {
    return NextResponse.json({ error: "Total weightage across all employee goals must equal 100" }, { status: 400 });
  }

  const goal = await prisma.$transaction(async (tx) => {
    const createdGoal = await tx.goal.create({
      data: {
        title,
        thrustArea,
        uomType,
        target,
        weightage,
        ownerId: user.id,
        cycleId,
        status: "DRAFT",
        isLocked: false,
      },
    });

    await tx.auditEvent.create({
      data: {
        goalId: createdGoal.id,
        actorId: user.id,
        action: "goal.created",
        newValue: title,
      },
    });

    return createdGoal;
  });

  return NextResponse.json({ goal }, { status: 201 });
}
