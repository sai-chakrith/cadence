import crypto from "crypto";

const DEFAULT_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 256);
const DEFAULT_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

const normalizeVector = (vector) => {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!norm) return vector;
  return vector.map((value) => value / norm);
};

const hashEmbedding = (text, dimensions = DEFAULT_DIMENSIONS) => {
  const hash = crypto.createHash("sha256").update(text).digest();
  const values = Array.from({ length: dimensions }, (_, index) => {
    const byte = hash[index % hash.length];
    return (byte - 128) / 128;
  });
  return normalizeVector(values);
};

export const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const length = Math.min(a.length, b.length);
  if (!length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i += 1) {
    const valueA = Number(a[i]) || 0;
    const valueB = Number(b[i]) || 0;
    dot += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const embedText = async (text) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const vector = hashEmbedding(text);
    return { vector, model: "hash", provider: "hash" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error("Embedding request failed");
    }

    const payload = await response.json();
    const vector = payload?.data?.[0]?.embedding;
    if (!Array.isArray(vector)) {
      throw new Error("Invalid embedding response");
    }

    return { vector: normalizeVector(vector), model: DEFAULT_MODEL, provider: "openai" };
  } catch (error) {
    const vector = hashEmbedding(text);
    return { vector, model: "hash", provider: "hash" };
  }
};
