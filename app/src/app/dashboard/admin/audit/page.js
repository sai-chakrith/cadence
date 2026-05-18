import Link from "next/link";
import AuditTrailTable from "../../../../components/AuditTrailTable";

export default function AdminAuditPage() {
  return (
    <div className="min-h-screen bg-aurora py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600 mt-2">Immutable history of every post-lock change.</p>
          </div>
          <Link
            href="/dashboard/admin"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin Console
          </Link>
        </header>

        <AuditTrailTable />
      </div>
    </div>
  );
}
