import { useEffect, useState } from "react";
import { getSystemAnalytics } from "../api/admin";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const ROLE_COLORS = {
  "Basic Users": "#6366f1",
  "Premium Members": "#22c55e",
  Administrators: "#f59e0b",
};

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function SystemAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSystemAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load system analytics:", err);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load system analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading system analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">
            System Analytics
          </h1>

          <p className="text-gray-500">
            View overall BudgetBuddy system statistics.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-red-50 text-red-600">
          {error}
        </div>

        <button
          onClick={loadAnalytics}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // ==========================================================
  // DERIVED CHART DATA
  // ==========================================================

  const roleDistributionData = [
    {
      name: "Basic Users",
      value: analytics?.basic_users ?? 0,
    },
    {
      name: "Premium Members",
      value: analytics?.premium_users ?? 0,
    },
    {
      name: "Administrators",
      value: analytics?.admin_users ?? 0,
    },
  ];

  const netFlow =
    (analytics?.total_income ?? 0) -
    (analytics?.total_expenses ?? 0);

  const financialFlowData = [
    {
      name: "Platform Financial Flow",
      Income: analytics?.total_income ?? 0,
      Expenses: analytics?.total_expenses ?? 0,
      Net: netFlow,
    },
  ];

  const registrationGrowthData = Array.isArray(
    analytics?.monthly_registrations
  )
    ? analytics.monthly_registrations
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold">
          System Analytics
        </h1>

        <p className="text-gray-500">
          View overall BudgetBuddy system statistics.
        </p>
      </div>


      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="border rounded-xl p-5 bg-white">
          <p className="text-sm text-gray-500">
            Total Users
          </p>

          <p className="text-3xl font-bold mt-2">
            {analytics?.total_users ?? 0}
          </p>
        </div>


        <div className="border rounded-xl p-5 bg-white">
          <p className="text-sm text-gray-500">
            Basic Users
          </p>

          <p className="text-3xl font-bold mt-2">
            {analytics?.basic_users ?? 0}
          </p>
        </div>


        <div className="border rounded-xl p-5 bg-white">
          <p className="text-sm text-gray-500">
            Premium Users
          </p>

          <p className="text-3xl font-bold mt-2">
            {analytics?.premium_users ?? 0}
          </p>
        </div>


        <div className="border rounded-xl p-5 bg-white">
          <p className="text-sm text-gray-500">
            Administrators
          </p>

          <p className="text-3xl font-bold mt-2">
            {analytics?.admin_users ?? 0}
          </p>
        </div>

      </div>


      {/* =====================================================
          USER ROLE DISTRIBUTION + PLATFORM FINANCIAL FLOW
          ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* USER ROLE DISTRIBUTION (DOUGHNUT) */}

        <div className="border rounded-xl p-5 bg-white">
          <h2 className="text-lg font-semibold">
            User Role Distribution
          </h2>

          <div className="mt-4" style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  stroke="none"
                >
                  {roleDistributionData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={ROLE_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* PLATFORM FINANCIAL FLOW (BAR) */}

        <div className="border rounded-xl p-5 bg-white">
          <h2 className="text-lg font-semibold">
            Platform Financial Flow
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Aggregate income, expenses and net liquidity
            across all users.
          </p>

          <div className="mt-4" style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={false} />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  width={90}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Net" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>


      {/* =====================================================
          ANNUAL USER REGISTRATION GROWTH
          ===================================================== */}

      <div className="border rounded-xl p-5 bg-white">
        <h2 className="text-lg font-semibold">
          Annual User Registration Growth
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          New user sign-ups by month, current year.
        </p>

        <div className="mt-4" style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={registrationGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name="New Users"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* =====================================================
          ADDITIONAL SYSTEM STATISTICS
          ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="border rounded-xl p-5 bg-white">
          <h2 className="text-lg font-semibold">
            Account Statistics
          </h2>

          <div className="mt-4 space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-500">
                Total Users
              </span>

              <span className="font-medium">
                {analytics?.total_users ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Basic Users
              </span>

              <span className="font-medium">
                {analytics?.basic_users ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Premium Users
              </span>

              <span className="font-medium">
                {analytics?.premium_users ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Administrators
              </span>

              <span className="font-medium">
                {analytics?.admin_users ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Active Users
              </span>

              <span className="font-medium">
                {analytics?.active_users ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Inactive Users
              </span>

              <span className="font-medium">
                {analytics?.inactive_users ?? 0}
              </span>
            </div>

          </div>
        </div>


        <div className="border rounded-xl p-5 bg-white">
          <h2 className="text-lg font-semibold">
            Financial Activity
          </h2>

          <div className="mt-4 space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-500">
                Total Income Records
              </span>

              <span className="font-medium">
                {analytics?.total_income_records ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Total Expense Records
              </span>

              <span className="font-medium">
                {analytics?.total_expense_records ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Total Budgets
              </span>

              <span className="font-medium">
                {analytics?.total_budgets ?? 0}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">
                Total Savings Goals
              </span>

              <span className="font-medium">
                {analytics?.total_savings_goals ?? 0}
              </span>
            </div>

          </div>
        </div>

      </div>


      {/* =====================================================
          REFRESH
          ===================================================== */}

      <button
        onClick={loadAnalytics}
        className="px-5 py-2 rounded-lg bg-blue-600 text-white"
      >
        Refresh Analytics
      </button>

    </div>
  );
}