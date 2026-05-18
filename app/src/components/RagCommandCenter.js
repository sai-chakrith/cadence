"use client";

import { useMemo, useState } from "react";

const SUGGESTIONS = [
  "Show Q2 completion dashboard for Sales",
  "Which employees are overdue after 5 days?",
  "What changed in Priya's goal sheet after lock?",
  "Compare manager check-in rates this quarter",
  "Show goal distribution by thrust area for Engineering"
];

export default function RagCommandCenter() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Welcome to the RAG command center. Ask me about completion rates, escalations, or audit trails.",
      facts: []
    }
  ]);

  const sendMessage = async (preset) => {
    const trimmed = (preset ?? input).trim();
    if (!trimmed || isLoading) return;

    const userId = Date.now();
    const assistantId = userId + 1;

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text: trimmed, facts: [] },
      { id: assistantId, role: "assistant", text: "Working on that...", facts: [] },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });

      if (!response.ok) {
        throw new Error("RAG request failed");
      }

      const data = await response.json();
      const answer = data.answer || "I could not find an answer for that yet.";
      const facts = Array.isArray(data.facts) ? data.facts : [];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, text: answer, facts } : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, text: "I could not reach the analytics service. Try again shortly.", facts: [] }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = useMemo(() => SUGGESTIONS.slice(0, 4), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-6">
      <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm animate-fade-up">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">RAG Command Center</h2>
            <p className="text-sm text-gray-500">Natural language over analytics, audit, and escalations.</p>
          </div>
          <span className="text-xs text-gray-500">Live query</span>
        </div>

        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-sm ${
                  message.role === "user"
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                <p>{message.text}</p>
                {message.facts?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {message.facts.map((fact) => (
                      <li key={fact} className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {quickReplies.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask about completion, audit changes, or escalations..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "Thinking..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-5 shadow-sm animate-fade-up">
          <h3 className="text-sm uppercase tracking-wide text-gray-500">Data Sources</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>Goals, weights, and UoM scores</li>
            <li>Audit events after lock date</li>
            <li>Completion rollups by department</li>
            <li>Escalation and check-in windows</li>
          </ul>
        </div>
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-5 shadow-sm animate-fade-up">
          <h3 className="text-sm uppercase tracking-wide text-gray-500">Response Routing</h3>
          <p className="text-sm text-gray-700 mt-2">
            Queries are classified into SQL summaries or vector retrieval, then synthesized into a narrative answer plus charts.
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-5 shadow-sm animate-fade-up">
          <h3 className="text-sm uppercase tracking-wide text-gray-500">Recommended Prompts</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            {SUGGESTIONS.map((item) => (
              <div key={item} className="rounded-lg border border-gray-200 px-3 py-2">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
