"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const FALLBACK_COMPLETION = [
  { dept: "Sales", rate: 82, delta: "+4%" },
  { dept: "Engineering", rate: 76, delta: "+2%" },
  { dept: "HR", rate: 91, delta: "+1%" },
];

const FALLBACK_SPOTLIGHT = [
  { label: "Check-ins completed", value: "18/24", note: "Q1 window" },
  { label: "Pending approvals", value: "6", note: "Managers reviewing" },
  { label: "Locked sheets", value: "12", note: "Pending manager review" },
];

export default function AdminDashboard() {
  const [completionByDept, setCompletionByDept] = useState(FALLBACK_COMPLETION);
  const [spotlight, setSpotlight] = useState(FALLBACK_SPOTLIGHT);
  const [cycleName, setCycleName] = useState("Q1 2024");
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState("");
  const [lastRebuildAt, setLastRebuildAt] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadOverview = async () => {
      try {
        const response = await fetch("/api/reports/overview");
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        if (Array.isArray(data.completionByDept) && data.completionByDept.length) {
          setCompletionByDept(
            data.completionByDept.map((item) => ({
              dept: item.dept,
              rate: item.rate,
              delta: "+0%"
            }))
          );
        }
        if (Array.isArray(data.highlights) && data.highlights.length) {
          setSpotlight(data.highlights);
        }
        if (data.cycle?.name) {
          setCycleName(data.cycle.name);
        }
      } catch (error) {
        // Keep fallback data
      }
    };

    const loadEmbeddingStatus = async () => {
      try {
        const response = await fetch("/api/embeddings/status");
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        setLastRebuildAt(data.lastRebuildAt || null);
      } catch (error) {
        // Keep fallback data
      }
    };

    loadOverview();
    loadEmbeddingStatus();
    const interval = setInterval(loadEmbeddingStatus, 60000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  const handleRebuild = async () => {
    if (rebuildLoading) return;
    setRebuildLoading(true);
    setRebuildMessage("Rebuilding embeddings...");

    try {
      const response = await fetch("/api/embeddings/rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 })
      });

      if (!response.ok) {
        throw new Error("Rebuild failed");
      }

      const data = await response.json();
      const goalsIndexed = data.goalsIndexed ?? 0;
      const auditsIndexed = data.auditsIndexed ?? 0;
      if (data.rebuiltAt) {
        setLastRebuildAt(data.rebuiltAt);
      }
      setRebuildMessage(`Indexed ${goalsIndexed} goals and ${auditsIndexed} audits.`);
    } catch (error) {
      setRebuildMessage("Failed to rebuild embeddings. Check logs for details.");
    } finally {
      setRebuildLoading(false);
    }
  };

  const rebuildLabel = lastRebuildAt
    ? new Date(lastRebuildAt).toLocaleString()
    : "Not rebuilt yet";

  return (
    <div className="min-h-screen bg-aurora py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
            <p className="text-gray-600 mt-2">Organization-wide reporting, controls, and audit oversight.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/admin/reports"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Reports
            </Link>
            <Link
              href="/dashboard/admin/audit"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Audit Trail
            </Link>
            <Link
              href="/dashboard/admin/rag"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black"
            >
              RAG Command Center
            </Link>
            <Link
              href="/dashboard/admin/demo"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Demo Prep
            </Link>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Completion Dashboard</h2>
                  <p className="text-sm text-gray-500">Live completion rates by department.</p>
                </div>
                <span className="text-xs text-gray-500">Updated 5 min ago</span>
              </div>
              <div className="space-y-4">
                {completionByDept.map((item) => (
                  <div key={item.dept} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-gray-700">{item.dept}</div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-14 text-right text-sm font-semibold text-gray-700">{item.rate}%</div>
                    <div className="w-12 text-right text-xs text-emerald-600">{item.delta}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {spotlight.map((item) => (
                <div key={item.label} className="bg-white/80 backdrop-blur p-5 rounded-lg border border-gray-200 shadow-sm animate-fade-up">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{item.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-up">
              <h2 className="text-xl font-semibold mb-4">Cycle Control</h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-medium">Active Cycle</h3>
                    <p className="text-sm text-gray-500">{cycleName} (April 1 - June 30)</p>
                  </div>
                  <Link
                    href="/dashboard/admin/reports"
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                </div>
                <div className="p-4 border border-gray-200 rounded flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-red-700">Admin Goal Unlock</h3>
                    <p className="text-sm text-gray-500">Override lock date for specific employees (audit logged).</p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100">
                    Unlock Goal
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Audit Trail Preview</h2>
                <Link href="/dashboard/admin/audit" className="text-sm text-teal-700 hover:underline">
                  Open full log
                </Link>
              </div>
              <div className="text-sm text-gray-600 border border-gray-200 rounded">
                <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between">
                  <span className="font-medium">Recent Activity</span>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
                <div className="p-3 border-b border-gray-200">
                  <span className="text-gray-400">10 mins ago</span> - Rohan Mehta <span className="font-medium text-green-700">APPROVED</span> Priya Nair&apos;s Q1 goals.
                </div>
                <div className="p-3">
                  <span className="text-gray-400">2 hrs ago</span> - Admin <span className="font-medium text-red-700">UNLOCKED</span> Amit Patel&apos;s goal. Reason: Medical leave exception.
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-up">
              <h2 className="text-lg font-semibold mb-2">RAG Command Center</h2>
              <p className="text-sm text-gray-600 mb-4">
                Ask natural language questions about completion rates, escalations, and audit changes.
              </p>
              <Link
                href="/dashboard/admin/rag"
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black"
              >
                Launch RAG Workspace
              </Link>
              <button
                onClick={handleRebuild}
                disabled={rebuildLoading}
                className="mt-3 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                {rebuildLoading ? "Rebuilding embeddings..." : "Rebuild embeddings"}
              </button>
              <p className="mt-3 text-xs text-gray-500">Last rebuild: {rebuildLabel}</p>
              {rebuildMessage && (
                <p className="mt-3 text-xs text-gray-500">{rebuildMessage}</p>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}