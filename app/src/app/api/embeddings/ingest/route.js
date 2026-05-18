import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { embedText } from "../../../../lib/embeddings";

const ALLOWED_SOURCES = ["GOAL", "AUDIT", "SUMMARY"];

export async function POST(request) {
  try {
    const body = await request.json();
    const { sourceType, sourceId, content, metadata, cycleId } = body || {};

    if (!sourceType || !sourceId || !content) {
      return NextResponse.json(
        { error: "sourceType, sourceId, and content are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_SOURCES.includes(sourceType)) {
      return NextResponse.json(
        { error: "Invalid sourceType" },
        { status: 400 }
      );
    }

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
