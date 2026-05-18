"use client";

import GoalSheet from "../../../components/GoalSheet";
import CheckInForm from "../../../components/CheckInForm";
import { useState } from "react";

export default function EmployeeDashboard() {
  const [tab, setTab] = useState("goals");

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome Priya Nair (Sales) — Manage your goals.</p>
          </div>
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button 
              onClick={() => setTab("goals")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition ${tab === "goals" ? "bg-white shadow text-black" : "text-gray-600 hover:text-black"}`}
            >
              Q1 Goal Setting
            </button>
            <button 
              onClick={() => setTab("checkin")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition ${tab === "checkin" ? "bg-white shadow text-black" : "text-gray-600 hover:text-black"}`}
            >
              Q1 Check-in
            </button>
          </div>
        </header>
        
        <main>
          {tab === "goals" ? <GoalSheet /> : <CheckInForm />}
        </main>
      </div>
    </div>
  );
}
