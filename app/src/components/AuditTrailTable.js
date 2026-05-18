"use client";

import { useEffect, useMemo, useState } from "react";

const ACTION_STYLES = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  UNLOCKED: "bg-rose-100 text-rose-700",
  RETURNED: "bg-amber-100 text-amber-700",
  UPDATED: "bg-slate-100 text-slate-700"
};

export default function AuditTrailTable() {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAudit = async () => {
      try {
        const response = await fetch("/api/audit?limit=50");
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        }
      } catch (error) {
        // Leave empty state when the audit API fails.
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadAudit();

    return () => {
      isActive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const matchesQuery =
        (event.actorName || event.actor || "").toLowerCase().includes(query.toLowerCase()) ||
        (event.employeeName || event.employee || "").toLowerCase().includes(query.toLowerCase()) ||
        (event.field || "").toLowerCase().includes(query.toLowerCase());
      const matchesAction = actionFilter === "all" || event.action === actionFilter;
      return matchesQuery && matchesAction;
    });
  }, [query, actionFilter, events]);

  return (
    <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-up">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-500">Immutable change log for all locked goal events.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by employee, actor, or field"
            className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="all">All actions</option>
            <option value="APPROVED">Approved</option>
            <option value="UNLOCKED">Unlocked</option>
            <option value="RETURNED">Returned</option>
            <option value="UPDATED">Updated</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="text-xs uppercase text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Field</th>
              <th className="py-3 px-4">Change</th>
              <th className="py-3 px-4">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((event) => {
              const actionStyle = ACTION_STYLES[event.action] || "bg-slate-100 text-slate-700";
              const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleString() : "";
              return (
                <tr key={event.id} className="bg-white/40">
                  <td className="py-3 px-4 whitespace-nowrap text-gray-500">{timestamp}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{event.actorName || event.actor}</td>
                  <td className="py-3 px-4">{event.employeeName || event.employee}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${actionStyle}`}>
                      {event.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">{event.field}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {event.oldValue}
                    {" → "}
                    {event.newValue}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{event.reason || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && (
        <p className="mt-4 text-xs text-gray-500">Loading audit events from the database...</p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="mt-4 text-xs text-gray-500">No audit events found for this filter.</p>
      )}
    </div>
  );
}
