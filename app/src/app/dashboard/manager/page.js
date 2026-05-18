"use client";

import { useState } from "react";

export default function ManagerDashboard() {
  const [teamMembers] = useState([
    { id: 1, name: "Priya Nair", role: "Sales Rep", status: "Pending Approval" },
    { id: 2, name: "Amit Patel", role: "Sales Rep", status: "Not Submitted" },
    { id: 3, name: "Neha Gupta", role: "Sales Rep", status: "Approved" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome Rohan Mehta (Sales L1) — Review your team's goals.</p>
        </header>
        
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-black">Team Submissions (Q1)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teamMembers.map(member => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${member.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                              member.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900" disabled={member.status === 'Not Submitted'}>
                            {member.status === 'Pending Approval' ? 'Review & Approve' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 text-black">
              <h2 className="text-lg font-semibold mb-4 text-black">Push Shared Goal</h2>
              <p className="text-sm text-gray-600 mb-4">Push a departmental KPI to your entire team's goal sheet.</p>
              <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium">
                + Create Shared Goal
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}