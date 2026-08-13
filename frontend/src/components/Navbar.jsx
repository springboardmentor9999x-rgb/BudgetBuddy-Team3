import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-lg font-medium transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r shadow-sm flex flex-col">

      {/* LOGO */}
      <div className="px-6 py-6 border-b">
        <h1 className="text-2xl font-bold text-blue-700">
          BudgetBuddy
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Personal Finance
        </p>
      </div>

      {/* USER */}
      <div className="px-6 py-5 border-b">
        <p className="text-sm text-gray-500">
          Welcome
        </p>

        <p className="font-semibold text-gray-800 truncate">
          {user?.email || "User"}
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-2">

        <NavLink to="/dashboard" className={linkClass}>
          🏠 Dashboard
        </NavLink>

        <NavLink to="/income" className={linkClass}>
          💰 Income
        </NavLink>

        <NavLink to="/expense" className={linkClass}>
          💸 Expenses
        </NavLink>

        <NavLink to="/budget" className={linkClass}>
          📊 Budget
        </NavLink>

        {/* Bank Account - page will be added later */}
        <div className="px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed">
          🏦 Bank Accounts
          <span className="text-xs ml-2">
            Soon
          </span>
        </div>

      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t">

        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition"
        >
          🚪 Logout
        </button>

      </div>

    </aside>
  );
}