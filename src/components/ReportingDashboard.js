"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const CHART_COLORS = ["#6D28D9", "#14B8A6", "#F97316", "#0EA5E9", "#22C55E"];
const OVERDUE_DAYS = 5;

const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200/70 ${className}`} />
);

export default function ReportingDashboard() {
  const [overview, setOverview] = useState({
    departments: [],
    highlights: [],
    cycle: null
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [qoqRows, setQoqRows] = useState([]);
  const [qoqLoading, setQoqLoading] = useState(true);
  const [missingRows, setMissingRows] = useState([]);
  const [missingLoading, setMissingLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadOverview = async () => {
      setOverviewLoading(true);
      try {
        const response = await fetch("/api/reports/overview");
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        setOverview({
          departments: data.departments || [],
          highlights: data.highlights || [],
          cycle: data.cycle || null
        });
      } catch (error) {
        // Leave empty state when the report API fails.
      } finally {
        if (isActive) setOverviewLoading(false);
      }
    };

    loadOverview();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadQoq = async () => {
      setQoqLoading(true);
      try {
        const response = await fetch("/api/reports/qoq");
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        setQoqRows(data.rows || []);
      } catch (error) {
        // Leave empty state when the report API fails.
      } finally {
        if (isActive) setQoqLoading(false);
      }
    };

    loadQoq();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadMissing = async () => {
      if (!overview.cycle?.id) {
        if (isActive) {
          setMissingRows([]);
          setMissingLoading(false);
        }
        return;
      }

      setMissingLoading(true);
      try {
        const params = new URLSearchParams({
          cycleId: overview.cycle.id,
          daysOverdue: String(OVERDUE_DAYS)
        });
        const response = await fetch(`/api/reports/missing?${params.toString()}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive) return;
        setMissingRows(data.rows || []);
      } catch (error) {
        // Leave empty state when the report API fails.
      } finally {
        if (isActive) setMissingLoading(false);
      }
    };

    loadMissing();

    return () => {
      isActive = false;
    };
  }, [overview.cycle?.id]);

  const highlights = overview.highlights || [];
  const departments = overview.departments || [];

  const completionData = useMemo(
    () =>
      departments.map((row) => ({
        name: row.department,
        value: Number(row.avgCompletionPct) || 0
      })),
    [departments]
  );

  const { qoqData, qoqDepartments } = useMemo(() => {
    if (!qoqRows.length) {
      return { qoqData: [], qoqDepartments: [] };
    }

    const byCycle = new Map();
    const departmentSet = new Set();

    qoqRows.forEach((row) => {
      const cycle = row.cycle || "Unknown";
      const department = row.department || "Unknown";
      const completionRate = Number(row.completionRate) || 0;

      departmentSet.add(department);

      if (!byCycle.has(cycle)) {
        byCycle.set(cycle, { cycle });
      }

      byCycle.get(cycle)[department] = completionRate;
    });

    return {
      qoqData: Array.from(byCycle.values()),
      qoqDepartments: Array.from(departmentSet.values())
    };
  }, [qoqRows]);

  const overdueByDepartment = useMemo(() => {
    if (!missingRows.length) return [];

    const counts = new Map();
    missingRows.forEach((row) => {
      const department = row.department || "Unknown";
      counts.set(department, (counts.get(department) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
  }, [missingRows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`highlight-skeleton-${index}`}
                className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-5 shadow-sm"
              >
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="mt-4 h-8 w-20" />
                <SkeletonBlock className="mt-3 h-3 w-32" />
              </div>
            ))
          : highlights.map((item) => (
              <div
                key={item.label}
                className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-5 shadow-sm animate-fade-up"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{item.value}</p>
                <p className="text-sm text-gray-500 mt-1">{item.note}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-6 shadow-sm animate-fade-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">QoQ Completion Rate</h2>
              <p className="text-sm text-gray-500">Completion trends by department.</p>
            </div>
            <span className="text-xs text-gray-500">Grouped by cycle</span>
          </div>
          {qoqLoading ? (
            <SkeletonBlock className="h-64 w-full" />
          ) : qoqData.length === 0 ? (
            <p className="text-sm text-gray-500">No data for this cycle.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qoqData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  {qoqDepartments.map((department, index) => (
                    <Bar
                      key={department}
                      dataKey={department}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-6 shadow-sm animate-fade-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Department Completion</h2>
              <p className="text-sm text-gray-500">
                {overview.cycle?.name ? overview.cycle.name : "Latest cycle"}
              </p>
            </div>
            <span className="text-xs text-gray-500">Avg completion %</span>
          </div>
          {overviewLoading ? (
            <SkeletonBlock className="h-64 w-full" />
          ) : completionData.length === 0 ? (
            <p className="text-sm text-gray-500">No data for this cycle.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-6 shadow-sm animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Overdue Employees</h2>
            <p className="text-sm text-gray-500">No submissions after {OVERDUE_DAYS} days.</p>
          </div>
          <span className="text-xs text-gray-500">By department</span>
        </div>
        {missingLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`overdue-skeleton-${index}`} className="rounded-lg border border-gray-200 p-4">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="mt-3 h-7 w-12" />
              </div>
            ))}
          </div>
        ) : overdueByDepartment.length === 0 ? (
          <p className="text-sm text-gray-500">No data for this cycle.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overdueByDepartment.map((dept, index) => (
              <div key={dept.department} className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{dept.department}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{dept.count}</p>
                <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
