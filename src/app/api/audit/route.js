import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const department = searchParams.get("department") || "";
    const actorId = searchParams.get("actorId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";

    const where = {};

    if (actorId) {
      where.actorId = actorId;
    }

    if (dateFrom) {
      const parsed = new Date(dateFrom);
      if (!Number.isNaN(parsed.getTime())) {
        where.timestamp = { gte: parsed };
      }
    }

    if (department) {
      where.goal = {
        owner: {
          department,
        },
      };
    }

    const [total, events] = await prisma.$transaction([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: true,
          goal: {
            include: { owner: true },
          },
        },
      }),
    ]);

    const payload = events.map((event) => ({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      actor: event.actor?.name || "System",
      actorName: event.actor?.name || "System",
      actorId: event.actorId,
      employee: event.goal?.owner?.name || "Unknown",
      employeeName: event.goal?.owner?.name || "Unknown",
      employeeDepartment: event.goal?.owner?.department || "",
      action: event.action,
      field: event.goal?.title || "Goal",
      oldValue: event.oldValue || "",
      newValue: event.newValue || "",
      reason: event.reason || ""
    }));

    return NextResponse.json({
      events: payload,
      page,
      limit,
      total,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load audit events" },
      { status: 500 }
    );
  }
}
