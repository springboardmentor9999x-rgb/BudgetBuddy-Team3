import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSystemAnalytics } from "../api/admin";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getSystemAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load Admin Dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          Loading Admin Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <h2 className="font-semibold mb-2">
            Unable to load Admin Dashboard
          </h2>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Admin Dashboard
        </h1>

        <p className="text-gray-500">
          Manage users and view aggregated system analytics.
        </p>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="rounded-xl border p-5 bg-white">
          <p className="text-sm text-gray-500">
            Total Users
          </p>

          <h2 className="text-3xl font-bold mt-1">
            {analytics?.total_users ?? 0}
          </h2>
        </div>

        {/* Basic Users */}
        <div className="rounded-xl border p-5 bg-white">
          <p className="text-sm text-gray-500">
            Basic Users
          </p>

          <h2 className="text-3xl font-bold mt-1">
            {analytics?.basic_users ?? 0}
          </h2>
        </div>

        {/* Premium Users */}
        <div className="rounded-xl border p-5 bg-white">
          <p className="text-sm text-gray-500">
            Premium Users
          </p>

          <h2 className="text-3xl font-bold mt-1">
            {analytics?.premium_users ?? 0}
          </h2>
        </div>

        {/* Active Users */}
        <div className="rounded-xl border p-5 bg-white">
          <p className="text-sm text-gray-500">
            Active Users
          </p>

          <h2 className="text-3xl font-bold mt-1">
            {analytics?.active_users ?? 0}
          </h2>
        </div>
      </div>

      {/* Financial System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="rounded-xl border p-5 bg-white">
          <p className="text-sm text-gray-500">
            Total Income
          </p>

          <h2 className="text-2xl font-bold mt-1">
            ₹
            {Number(
              analytics?.total_income || 0
            ).toFixed(2)}
          </h2>
        </div>

        {/* Total Expenses */}
        <div className="rounded-xl border p-5 bg-white">
          <p className="text-sm text-gray-500">
            Total Expenses
          </p>

          <h2 className="text-2xl font-bold mt-1">
            ₹
            {Number(
              analytics?.total_expenses || 0
            ).toFixed(2)}
          </h2>
        </div>

        {/* Total Savings */}
        <div className="rounded-xl border p-5 bg-white">
          <p className="text-sm text-gray-500">
            Total Savings
          </p>

          <h2 className="text-2xl font-bold mt-1">
            ₹
            {Number(
              analytics?.total_savings || 0
            ).toFixed(2)}
          </h2>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold mb-4">
          Admin Tools
        </h2>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/users"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            User Management
          </Link>

          <Link
            to="/admin/system-analytics"
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition"
          >
            System Analytics
          </Link>

          <Link
            to="/analytics"
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition"
          >
            My Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}