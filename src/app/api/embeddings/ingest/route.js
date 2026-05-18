import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { embedText } from "../../../../lib/embeddings";

const ALLOWED_SOURCES = ["GOAL", "AUDIT", "SUMMARY"];
const ingestSchema = z.object({
  sourceType: z.enum(ALLOWED_SOURCES),
  sourceId: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  cycleId: z.string().nullable().optional()
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = ingestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sourceType, sourceId, content, metadata, cycleId } = parsed.data;

    const embeddingResult = await embedText(content);
    const embedding = embeddingResult.vector;
    const dimensions = embedding.length;

    const record = await prisma.embedding.upsert({
      where: {
        sourceType_sourceId: {
          sourceType,
          sourceId
        }
      },
      update: {
        content,
        embedding,
        dimensions,
        metadata: {
          ...(metadata || {}),
          provider: embeddingResult.provider,
          model: embeddingResult.model
        },
        cycleId: cycleId || null
      },
      create: {
        sourceType,
        sourceId,
        content,
        embedding,
        dimensions,
        metadata: {
          ...(metadata || {}),
          provider: embeddingResult.provider,
          model: embeddingResult.model
        },
        cycleId: cycleId || null
      }
    });

    await prisma.$executeRaw`
      UPDATE "Embedding"
      SET vector = ${embedding}::vector
      WHERE id = ${record.id}
    `;

    return NextResponse.json({
      id: record.id,
      sourceType: record.sourceType,
      dimensions
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to ingest embedding" },
      { status: 500 }
    );
  }
}
