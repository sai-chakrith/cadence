import Link from "next/link";
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">AtomQuest HR Portal</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Welcome to the evaluation demo. To test the BRD requirements, please start the employee journey.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/dashboard/employee"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700"
          >
            Employee Demo
          </Link>
          <Link 
            href="/dashboard/manager"
            className="inline-block px-6 py-3 bg-white border border-blue-600 text-blue-600 font-medium rounded-lg shadow hover:bg-blue-50"
          >
            Manager Demo
          </Link>
          <Link 
            href="/dashboard/admin"
            className="inline-block px-6 py-3 bg-gray-800 text-white font-medium rounded-lg shadow hover:bg-gray-900"
          >
            Admin Demo
          </Link>
          <Link
            href="/dashboard/admin/demo"
            className="inline-block px-6 py-3 bg-white border border-gray-400 text-gray-700 font-medium rounded-lg shadow hover:bg-gray-100"
          >
            Demo Prep
          </Link>
        </div>
      </div>
    </div>
  );
}
