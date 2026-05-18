"use client";

import { useState, useMemo } from "react";

const UOM_TYPES = ["MIN", "MAX", "TIMELINE", "ZERO"];

export default function GoalSheet() {
  const [goals, setGoals] = useState([
    { id: 1, title: "", thrustArea: "", uomType: "MIN", target: 0, weightage: 10 }
  ]);
  const [isLocked, setIsLocked] = useState(false);

  const totalWeightage = useMemo(() => {
    const sum = goals.reduce((total, g) => total + (Number(g.weightage) || 0), 0);
    return Number(sum.toFixed(2));
  }, [goals]);

  const isTotalValid = Math.abs(totalWeightage - 100) < 0.01;
  const hasMinViolation = goals.some((g) => Number(g.weightage) < 10);

  const addGoal = () => {
    if (goals.length >= 8) return;
    setGoals([...goals, { 
      id: Date.now(), title: "", thrustArea: "", uomType: "MIN", target: 0, weightage: 10 
    }]);
  };

  const removeGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const updateGoal = (id, field, value) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleSubmit = async () => {
    if (!isTotalValid) {
      alert("Total weightage must be exactly 100%");
      return;
    }
    if (hasMinViolation) {
      alert("Each goal must have at least 10% weightage.");
      return;
    }
    
    // TODO: Connect to backend API
    setIsLocked(true);
    alert("Goals submitted and locked for manager approval!");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">My Goal Sheet (Q1)</h2>
        <div className={`px-4 py-2 rounded font-bold ${isTotalValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Total Weightage: {totalWeightage}%
        </div>
      </div>
      {!isTotalValid && (
        <p className="text-xs text-red-600 mb-4">Total must be exactly 100% to submit.</p>
      )}

      {isLocked && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          🔒 Your goal sheet is locked and pending manager approval.
        </div>
      )}

      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div key={goal.id} className="p-4 border border-gray-200 rounded relative group">
            {!isLocked && goals.length > 1 && (
              <button 
                onClick={() => removeGoal(goal.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase">Title</label>
                <input 
                  disabled={isLocked}
                  type="text" 
                  value={goal.title}
                  onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-black"
                  placeholder="e.g. Increase outbound sales"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Thrust Area</label>
                <input 
                  disabled={isLocked}
                  type="text"
                  value={goal.thrustArea}
                  onChange={(e) => updateGoal(goal.id, 'thrustArea', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-black"
                  placeholder="e.g. Revenue"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">UoM & Target</label>
                <div className="flex mt-1">
                  <select 
                    disabled={isLocked}
                    value={goal.uomType}
                    onChange={(e) => updateGoal(goal.id, 'uomType', e.target.value)}
                    className="border border-gray-300 rounded-l p-2 w-1/2 text-black bg-gray-50"
                  >
                    {UOM_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input 
                    disabled={isLocked}
                    type="number" 
                    value={goal.target}
                    onChange={(e) => updateGoal(goal.id, 'target', e.target.value)}
                    className="border-y border-r border-gray-300 rounded-r p-2 w-1/2 text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Weightage (%)</label>
                <input 
                  disabled={isLocked}
                  type="number" 
                  min="10"
                  max="100"
                  value={goal.weightage}
                  onChange={(e) => updateGoal(goal.id, 'weightage', Number(e.target.value))}
                  className={`mt-1 w-full border rounded p-2 text-black ${goal.weightage < 10 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {Number(goal.weightage) < 10 && <span className="text-red-500 text-xs">Min 10%</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Rules: Total weightage must equal 100%, each goal minimum 10%, maximum 8 goals per employee.
      </p>

      {!isLocked && (
        <div className="mt-6 flex justify-between items-center outline-none">
          <button 
            onClick={addGoal}
            disabled={goals.length >= 8}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Goal (Max 8)
          </button>

          <button 
            onClick={handleSubmit}
            disabled={!isTotalValid || hasMinViolation}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow"
          >
            Submit to Manager
          </button>
        </div>
      )}
    </div>
  );
}
