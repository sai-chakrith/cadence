import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { embedText } from "./embeddings";

export const retrieveSimilarEmbeddings = async (query, options = {}) => {
  const { topK = 5, sourceType } = options;
  const { vector } = await embedText(query);

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id, "sourceType", "sourceId", content, "cycleId", metadata
      FROM "Embedding"
      WHERE vector IS NOT NULL
        ${sourceType ? Prisma.sql`AND "sourceType" = ${sourceType}` : Prisma.empty}
      ORDER BY vector <=> ${vector}::vector
      LIMIT ${topK}
    `
  );

  return rows.map((row) => ({
    id: row.id,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    content: row.content,
    cycleId: row.cycleId,
    metadata: row.metadata || {}
  }));
};
