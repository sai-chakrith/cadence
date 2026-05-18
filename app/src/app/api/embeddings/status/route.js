import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const latest = await prisma.embedding.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    });

    return NextResponse.json({
      lastRebuildAt: latest?.updatedAt ? latest.updatedAt.toISOString() : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load embedding status" },
      { status: 500 }
    );
  }
}
