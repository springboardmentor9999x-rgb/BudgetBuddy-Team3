import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-blue-50"
    }`;

  return (
    <aside className="w-64 min-h-screen bg-white shadow-lg flex flex-col">

      {/* LOGO */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-700">
          BudgetBuddy
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Personal Finance
        </p>
      </div>

      {/* MENU */}
      <nav className="p-4 space-y-2 flex-1">

        {/* DASHBOARD */}
        <NavLink
          to="/dashboard"
          className={linkClass}
        >
          🏠
          <span>Dashboard</span>
        </NavLink>

        {/* INCOME */}
        <NavLink
          to="/income"
          className={linkClass}
        >
          💰
          <span>Income</span>
        </NavLink>

        {/* EXPENSES */}
        <NavLink
          to="/expense"
          className={linkClass}
        >
          💸
          <span>Expenses</span>
        </NavLink>

        {/* BUDGET */}
        <NavLink
          to="/budget"
          className={linkClass}
        >
          📊
          <span>Budget</span>
        </NavLink>

        {/* SAVINGS GOALS */}
        <NavLink
          to="/savings-goals"
          className={linkClass}
        >
          🎯
          <span>Savings Goals</span>
        </NavLink>

        {/* BANK ACCOUNT */}
        <NavLink
          to="/bank-account"
          className={linkClass}
        >
          🏦
          <span>Bank Account</span>
        </NavLink>

      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
        >
          🚪
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}