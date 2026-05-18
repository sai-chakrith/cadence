import OpenAI from "openai";

const DEFAULT_MODEL = "text-embedding-3-small";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const embedText = async (text) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate embeddings");
  }

  const response = await openai.embeddings.create({
    model: DEFAULT_MODEL,
    input: text
  });

  const vector = response?.data?.[0]?.embedding;
  if (!Array.isArray(vector)) {
    throw new Error("Invalid embedding response from OpenAI");
  }

  return { vector, model: DEFAULT_MODEL, provider: "openai" };
};
