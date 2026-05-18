import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { embedText } from "../../../../lib/embeddings";

const buildGoalContent = (goal) => {
  const owner = goal.owner || {};
  return [
    `Goal: ${goal.title}`,
    `Employee: ${owner.name || "Unknown"}`,
    `Department: ${owner.department || "Unknown"}`,
    `Cycle: ${goal.cycle?.name || ""}`,
    `Thrust Area: ${goal.thrustArea}`,
    `Target: ${goal.target}`,
    `Weightage: ${goal.weightage}`,
    `Status: ${goal.status}`,
    `Actual: ${goal.actual ?? "N/A"}`
  ].join(". ");
};

const buildAuditContent = (event) => {
  const owner = event.goal?.owner || {};
  const actor = event.actor || {};
  const change = `${event.oldValue || ""} -> ${event.newValue || ""}`.trim();

  return [
    "Audit event",
    `Employee: ${owner.name || "Unknown"}`,
    `Actor: ${actor.name || "System"}`,
    `Action: ${event.action}`,
    `Field: ${event.goal?.title || "Goal"}`,
    `Change: ${change || "N/A"}`,
    `Reason: ${event.reason || "N/A"}`
  ].join(". ");
};

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Number(body?.limit || 50);
    const cappedLimit = Number.isNaN(limit) ? 50 : Math.min(limit, 200);
    const cycleId = body?.cycleId || null;

    const cycle = cycleId
      ? await prisma.cycle.findUnique({ where: { id: cycleId } })
      : await prisma.cycle.findFirst({ orderBy: { startDate: "desc" } });

    if (!cycle) {
      return NextResponse.json(
        { error: "No cycle found to rebuild embeddings" },
        { status: 404 }
      );
    }

    const goals = await prisma.goal.findMany({
      where: { cycleId: cycle.id },
      include: { owner: true, cycle: true },
      orderBy: { updatedAt: "desc" },
      take: cappedLimit
    });

    const audits = await prisma.auditEvent.findMany({
      where: { goal: { cycleId: cycle.id } },
      include: { actor: true, goal: { include: { owner: true } } },
      orderBy: { timestamp: "desc" },
      take: cappedLimit
    });

    let goalsIndexed = 0;
    let auditsIndexed = 0;

    for (const goal of goals) {
      const content = buildGoalContent(goal);
      const embeddingResult = await embedText(content);

      await prisma.embedding.upsert({
        where: {
          sourceType_sourceId: {
            sourceType: "GOAL",
            sourceId: goal.id
          }
        },
        update: {
          content,
          embedding: embeddingResult.vector,
          dimensions: embeddingResult.vector.length,
          metadata: {
            provider: embeddingResult.provider,
            model: embeddingResult.model,
            ownerId: goal.ownerId,
            cycleId: cycle.id
          },
          cycleId: cycle.id
        },
        create: {
          sourceType: "GOAL",
          sourceId: goal.id,
          content,
          embedding: embeddingResult.vector,
          dimensions: embeddingResult.vector.length,
          metadata: {
            provider: embeddingResult.provider,
            model: embeddingResult.model,
            ownerId: goal.ownerId,
            cycleId: cycle.id
          },
          cycleId: cycle.id
        }
      });

      goalsIndexed += 1;
    }

    for (const event of audits) {
      const content = buildAuditContent(event);
      const embeddingResult = await embedText(content);

      await prisma.embedding.upsert({
        where: {
          sourceType_sourceId: {
            sourceType: "AUDIT",
            sourceId: event.id
          }
        },
        update: {
          content,
          embedding: embeddingResult.vector,
          dimensions: embeddingResult.vector.length,
          metadata: {
            provider: embeddingResult.provider,
            model: embeddingResult.model,
            actorId: event.actorId,
            cycleId: cycle.id
          },
          cycleId: cycle.id
        },
        create: {
          sourceType: "AUDIT",
          sourceId: event.id,
          content,
          embedding: embeddingResult.vector,
          dimensions: embeddingResult.vector.length,
          metadata: {
            provider: embeddingResult.provider,
            model: embeddingResult.model,
            actorId: event.actorId,
            cycleId: cycle.id
          },
          cycleId: cycle.id
        }
      });

      auditsIndexed += 1;
    }

    const rebuiltAt = new Date().toISOString();

    return NextResponse.json({
      cycleId: cycle.id,
      goalsIndexed,
      auditsIndexed,
      rebuiltAt
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to rebuild embeddings" },
      { status: 500 }
    );
  }
}
