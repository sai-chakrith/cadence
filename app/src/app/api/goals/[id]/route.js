import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

function resolveAction(body) {
  const raw = String(body?.action || body?.status || "").toLowerCase();
  if (raw === "approve" || raw === "approved") return "approve";
  if (raw === "return" || raw === "returned") return "return";
  if (raw === "unlock" || raw === "unlocked" || raw === "draft") return "unlock";
  return null;
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = resolveAction(body);
  if (!action) {
    return NextResponse.json({ error: "action must be approve, return, or unlock" }, { status: 400 });
  }

  const goal = await prisma.goal.findUnique({
    where: { id: params.id },
    include: { owner: true },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (action === "unlock") {
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admin can unlock goals" }, { status: 403 });
    }

    const reason = String(body?.unlockReason || body?.reason || "").trim();
    if (!reason) {
      return NextResponse.json({ error: "unlockReason is required" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.goal.update({
        where: { id: goal.id },
        data: {
          status: "DRAFT",
          isLocked: false,
          unlockReason: reason,
        },
      });

      await tx.auditEvent.create({
        data: {
          goalId: goal.id,
          actorId: user.id,
          action: "goal.unlocked",
          reason,
        },
      });

      return saved;
    });

    return NextResponse.json({ goal: updated });
  }

  const isManager = user.role === "MANAGER" && goal.owner?.managerId === user.id;
  if (!isManager && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the goal's manager or admin can update it" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const data = {
      isLocked: true,
    };

    let auditAction = "goal.updated";
    if (action === "approve") {
      data.status = "APPROVED";
      auditAction = "goal.approved";
    }

    if (action === "return") {
      const comment = String(body?.returnComment || body?.comment || "").trim();
      if (!comment) {
        throw new Error("RETURN_COMMENT_REQUIRED");
      }
      data.status = "RETURNED";
      data.returnComment = comment;
      auditAction = "goal.returned";
    }

    const saved = await tx.goal.update({
      where: { id: goal.id },
      data,
    });

    await tx.auditEvent.create({
      data: {
        goalId: goal.id,
        actorId: user.id,
        action: auditAction,
        reason: action === "return" ? saved.returnComment : undefined,
      },
    });

    return saved;
  }).catch((error) => {
    if (error?.message === "RETURN_COMMENT_REQUIRED") {
      return null;
    }
    throw error;
  });

  if (!updated) {
    return NextResponse.json({ error: "returnComment is required" }, { status: 400 });
  }

  return NextResponse.json({ goal: updated });
}
