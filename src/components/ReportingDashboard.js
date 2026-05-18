"use client";

import { useEffect, useState } from "react";

const TONES = ["bg-emerald-500", "bg-blue-500", "bg-teal-500", "bg-amber-500", "bg-purple-500"];

export default function ReportingDashboard() {
  const [overview, setOverview] = useState({
    completionByDept: [],
    distribution: [],
    highlights: [],
    cycle: null,
  });

  useEffect(() => {
    let isActive = true;

    const loadOverview = async () => {
      try {
        const response = await fetch("/api/reports/overview");
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        setOverview({
          completionByDept: data.completionByDept || [],
          distribution: data.distribution || [],
          highlights: data.highlights || [],
          cycle: data.cycle || null
        });
      } catch (error) {
        // Leave empty state when the report API fails.
      }
    };

    loadOverview();

    return () => {
      isActive = false;
    };
  }, []);

  const completion = overview.completionByDept || [];
  const distribution = overview.distribution || [];
  const highlights = overview.highlights || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlights.map((item) => (
          <div key={item.label} className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-5 shadow-sm animate-fade-up">
            <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{item.value}</p>
            <p className="text-sm text-gray-500 mt-1">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-6 shadow-sm animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Completion by Department</h2>
            <p className="text-sm text-gray-500">
              {overview.cycle?.name ? `${overview.cycle.name} check-in progress.` : "Check-in completion progress."}
            </p>
          </div>
          <span className="text-xs text-gray-500">Updated 5 min ago</span>
        </div>
        <div className="space-y-4">
          {completion.map((dept, index) => {
            const tone = TONES[index % TONES.length];
            return (
              <div key={dept.dept} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-gray-700">{dept.dept}</div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div className={`h-2 rounded-full ${tone}`} style={{ width: `${dept.rate}%` }} />
                  </div>
                </div>
                <div className="w-14 text-right text-sm font-semibold text-gray-700">{dept.rate}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-6 shadow-sm animate-fade-up">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Goal Distribution</h2>
        <p className="text-sm text-gray-500 mb-6">Thrust areas across all departments for Q1.</p>
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                <span>{item.label}</span>
                <span className="font-semibold">{item.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-gray-800" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
