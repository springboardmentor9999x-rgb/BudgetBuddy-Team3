import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-8 py-4 flex justify-between items-center shadow">

        <h1 className="text-2xl font-bold">
          💰 BudgetBuddy
        </h1>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
        >
          Logout
        </button>

      </nav>

      <div className="max-w-7xl mx-auto p-8">

        <h2 className="text-3xl font-bold mb-8">
          Dashboard
        </h2>

        {/* Summary Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500">Total Income</h3>
            <p className="text-3xl font-bold text-green-600 mt-3">
              ₹0
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-500 mt-3">
              ₹0
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500">Savings</h3>
            <p className="text-3xl font-bold text-blue-600 mt-3">
              ₹0
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500">Budget</h3>
            <p className="text-3xl font-bold text-purple-600 mt-3">
              ₹0
            </p>
          </div>

        </div>

        {/* Quick Actions */}

        <div className="mt-10">

          <h2 className="text-2xl font-semibold mb-4">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-4">

            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg">
              + Add Income
            </button>

            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg">
              + Add Expense
            </button>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              + Set Budget
            </button>

          </div>

        </div>

        {/* Recent Transactions */}

        <div className="bg-white rounded-xl shadow mt-10">

          <div className="p-6 border-b">

            <h2 className="text-3xl font-bold mb-2">
              Dashboard
            </h2>

            <p className="text-gray-600 mb-8">
              Welcome back, {user?.email}
            </p>

          </div>

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left p-4">Date</th>

                <th className="text-left p-4">Category</th>

                <th className="text-left p-4">Type</th>

                <th className="text-left p-4">Amount</th>

              </tr>

            </thead>

            <tbody>

              <tr>

                <td
                  colSpan="4"
                  className="text-center text-gray-500 p-8"
                >
                  No transactions available
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}