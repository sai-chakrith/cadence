"use client";

import { useState } from "react";

export default function CheckInForm({ initialGoals }) {
  const [goals, setGoals] = useState(initialGoals || [
    { id: 1, title: "Increase Revenue", uomType: "MIN", target: 1000000, actual: 0, weightage: 50 },
    { id: 2, title: "Reduce Churn", uomType: "MAX", target: 5, actual: 0, weightage: 30 },
    { id: 3, title: "Zero Escalations", uomType: "ZERO", target: 0, actual: 0, weightage: 20 },
  ]);

  // UOM Score Formulas processing on the client
  const calculateScore = (actual, target, type) => {
    actual = Number(actual);
    target = Number(target);
    
    switch(type) {
      case "MIN": 
        if (target === 0) return 0;
        return Math.min(100, (actual / target) * 100);
      case "MAX": 
        if (actual === 0) return 100;
        if (target === 0) return 0;
        return Math.min(100, (target / actual) * 100);
      case "ZERO":
        return actual === 0 ? 100 : 0;
      case "TIMELINE":
        // For timeline, we just assign simple 100 if completed, 0 if not for this UI demo 
        // Actual logic might use dates
        return actual >= target ? 100 : 0;
      default:
        return 0;
    }
  };

  const calculateWeightedScore = () => {
    return goals.reduce((total, goal) => {
      const rawScore = calculateScore(goal.actual, goal.target, goal.uomType);
      return total + (rawScore * (goal.weightage / 100));
    }, 0);
  };

  const handleActualChange = (id, newActual) => {
    setGoals(goals.map(g => g.id === id ? { ...g, actual: newActual } : g));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Q1 Check-in</h2>
          <p className="text-sm text-gray-500">Record your actual achievements for this cycle.</p>
          <p className="text-xs text-gray-400 mt-1">Check-in window: Jul 1 to Jul 15.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Weighted Performance</p>
          <p className="text-2xl font-bold text-blue-600">{calculateWeightedScore().toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-6 text-black">
        {goals.map(goal => {
          const score = calculateScore(goal.actual, goal.target, goal.uomType);
          return (
            <div key={goal.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded border border-gray-100 items-center">
              <div className="md:col-span-2">
                <p className="font-medium text-gray-900">{goal.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-700">{goal.uomType}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded text-blue-800">Target: {goal.target}</span>
                  <span className="text-xs px-2 py-1 bg-purple-100 rounded text-purple-800">Weight: {goal.weightage}%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Actual Achievement</label>
                <input 
                  type="number" 
                  value={goal.actual}
                  onChange={(e) => handleActualChange(goal.id, e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-black"
                />
              </div>

              <div className="text-right">
                <span className="block text-xs font-medium text-gray-500 uppercase mb-1">Score ({goal.uomType} calc)</span>
                <span className={`text-lg font-bold ${score >= 90 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {score.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow font-medium">
          Submit Check-in
        </button>
      </div>
    </div>
  );
}