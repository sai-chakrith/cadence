import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { embedText } from "../../../lib/embeddings";

const requestSchema = z.object({
  message: z.string().min(1)
});

const buildContextString = (rows) => {
  if (!rows.length) {
    return "No relevant context found in the database.";
  }

  return rows
    .map((row, index) => `Chunk ${index + 1}:\n${row.content}`)
    .join("\n\n");
};

const buildPrompt = (contextString, userQuery) => {
  return [
    "You are an HR analytics assistant for Cadence. Answer based only on the data provided.",
    "",
    "CONTEXT:",
    contextString,
    "",
    `QUESTION: ${userQuery}`,
    "",
    "If the question asks for a chart or table, include a JSON block at the end formatted as:",
    "```chart",
    '{ "type": "bar", "labels": [...], "data": [...], "title": "..." }',
    "```"
  ].join("\n");
};

const extractClaudeText = (payload) => {
  const content = Array.isArray(payload?.content) ? payload.content : [];
  const text = content
    .map((block) => block?.text || "")
    .join("")
    .trim();
  return text || "I could not generate a response.";
};

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userQuery = parsed.data.message.trim();
    const { vector } = await embedText(userQuery);

    const results = await prisma.$queryRaw`
      SELECT id, content, metadata
      FROM "Embedding"
      WHERE vector IS NOT NULL
      ORDER BY vector <=> ${vector}::vector
      LIMIT 5
    `;

    const contextString = buildContextString(results);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: buildPrompt(contextString, userQuery)
          }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to reach Anthropic" },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const answer = extractClaudeText(payload);

    return NextResponse.json({
      answer
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process RAG query" },
      { status: 500 }
    );
  }
}
