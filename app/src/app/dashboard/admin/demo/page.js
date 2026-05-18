import Link from "next/link";

const DEMO_USERS = [
  { role: "Employee", name: "Priya Nair", email: "priya.nair@atomberg.com", password: "password123" },
  { role: "Manager", name: "Rohan Mehta", email: "rohan.mehta@atomberg.com", password: "password123" },
  { role: "Admin", name: "System Admin", email: "admin@atomberg.com", password: "password123" }
];

const DEMO_FLOW = [
  "Employee: create 3 goals, show total weightage hitting 100% and block at 101%.",
  "Employee: submit goals, show locked state and pending manager approval.",
  "Manager: review and approve goals, show audit trail entry.",
  "Manager: push shared KPI to team (show read-only fields).",
  "Employee: check-in, show UoM score logic with live weighted score.",
  "Admin: show completion dashboard and audit trail filter.",
  "Admin: open RAG command center and run 3-4 prompts."
];

const EDGE_CASES = [
  "Total weightage must equal 100% (exact).",
  "Each goal weightage minimum 10%.",
  "Max 8 goals per employee.",
  "Check-in form locked outside Jul/Oct/Jan/Mar windows.",
  "Zero UoM: 0 achievement => 100%, else 0%."
];

const RAG_PROMPTS = [
  "Show Q2 completion dashboard for Sales",
  "Which employees are overdue after 5 days?",
  "What changed in Priya's goal sheet after lock?",
  "Compare manager check-in rates this quarter",
  "Show goal distribution by thrust area for Engineering"
];

export default function DemoPrepPage() {
  return (
    <div className="min-h-screen bg-aurora py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Demo Prep Checklist</h1>
            <p className="text-gray-600 mt-2">Runbook, credentials, and edge-case validation guide.</p>
          </div>
          <Link
            href="/dashboard/admin"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin Console
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-up">
              <h2 className="text-xl font-semibold mb-4">Demo Flow (8-10 minutes)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                {DEMO_FLOW.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-up">
              <h2 className="text-xl font-semibold mb-4">Edge-case Checks</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                {EDGE_CASES.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gray-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-up">
              <h2 className="text-xl font-semibold mb-4">RAG Demo Prompts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                {RAG_PROMPTS.map((prompt) => (
                  <div key={prompt} className="rounded-lg border border-gray-200 px-3 py-2 bg-white">
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-up">
              <h2 className="text-lg font-semibold mb-4">Demo Credentials</h2>
              <div className="space-y-3 text-sm text-gray-700">
                {DEMO_USERS.map((user) => (
                  <div key={user.role} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <p className="font-semibold text-gray-900">{user.role}: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <p>Password: {user.password}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-up">
              <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
              <div className="flex flex-col gap-2 text-sm">
                <Link className="text-teal-700 hover:underline" href="/dashboard/employee">Employee Journey</Link>
                <Link className="text-teal-700 hover:underline" href="/dashboard/manager">Manager Journey</Link>
                <Link className="text-teal-700 hover:underline" href="/dashboard/admin">Admin Console</Link>
                <Link className="text-teal-700 hover:underline" href="/dashboard/admin/reports">Reports</Link>
                <Link className="text-teal-700 hover:underline" href="/dashboard/admin/audit">Audit Trail</Link>
                <Link className="text-teal-700 hover:underline" href="/dashboard/admin/rag">RAG Command Center</Link>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-up">
              <h2 className="text-lg font-semibold mb-4">Artifacts</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>Architecture diagram PDF with cost annotations.</li>
                <li>Seeded demo data for all 3 roles.</li>
                <li>Pre-recorded fallback video (optional).</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
