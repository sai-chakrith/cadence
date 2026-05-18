import { prisma } from "./prisma";
import { cosineSimilarity, embedText } from "./embeddings";

const MAX_CANDIDATES = Number(process.env.RAG_CANDIDATE_LIMIT || 200);

export const retrieveSimilarEmbeddings = async (query, options = {}) => {
  const { topK = 4, sourceType } = options;
  const { vector } = await embedText(query);

  const candidates = await prisma.embedding.findMany({
    where: sourceType ? { sourceType } : undefined,
    orderBy: { updatedAt: "desc" },
    take: Math.min(MAX_CANDIDATES, 500)
  });

  const scored = candidates
    .map((item) => {
      const embedding = Array.isArray(item.embedding)
        ? item.embedding
        : Array.isArray(item.embedding?.vector)
          ? item.embedding.vector
          : [];
      const score = cosineSimilarity(vector, embedding);
      return {
        id: item.id,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        content: item.content,
        cycleId: item.cycleId,
        score
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
};
