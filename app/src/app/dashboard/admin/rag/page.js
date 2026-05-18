"use client";

import Link from "next/link";
import RagCommandCenter from "../../../../components/RagCommandCenter";
import { useEffect, useState } from "react";

export default function AdminRagPage() {
  const [lastRebuildAt, setLastRebuildAt] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadEmbeddingStatus = async () => {
      try {
        const response = await fetch("/api/embeddings/status");
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        setLastRebuildAt(data.lastRebuildAt || null);
      } catch (error) {
        // Keep fallback
      }
    };

    loadEmbeddingStatus();
    const interval = setInterval(loadEmbeddingStatus, 60000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  const rebuildLabel = lastRebuildAt
    ? new Date(lastRebuildAt).toLocaleString()
    : "Not rebuilt yet";

  return (
    <div className="min-h-screen bg-aurora py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RAG Command Center</h1>
            <p className="text-gray-600 mt-2">Ask natural language questions over HR analytics and audit logs.</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="text-xs text-gray-500">Last rebuild: {rebuildLabel}</span>
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Admin Console
            </Link>
          </div>
        </header>

        <RagCommandCenter />
      </div>
    </div>
  );
}
