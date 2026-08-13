import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);

  // ==========================================================
  // UPDATE NAME
  // ==========================================================

  const updateName = async () => {
    const newName = name.trim();

    if (!newName) {
      toast.error("Name cannot be empty");
      return;
    }

    if (newName.length < 2) {
      toast.error("Name must contain at least 2 characters");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/auth/me/name", {
        full_name: newName,
      });

      // Update local user data
      if (user) {
        user.full_name = response.data.full_name;
      }

      setName(response.data.full_name);
      setEditingName(false);

      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Failed to update name:", error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to update name"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL NAME EDIT
  // ==========================================================

  const cancelNameEdit = () => {
    setName(user?.full_name || "");
    setEditingName(false);
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-100">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="
          fixed
          left-0
          top-0
          h-screen
          w-64
          bg-blue-600
          text-white
          flex
          flex-col
          shadow-lg
          z-50
        "
      >

        {/* LOGO */}

        <div className="px-6 py-5 border-b border-blue-500">
          <h1 className="text-2xl font-bold">
            BudgetBuddy
          </h1>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 py-6">

          <div className="space-y-2">

            {/* DASHBOARD */}

            <button
              onClick={() => navigate("/dashboard")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                hover:bg-blue-500
                transition
                text-left
              "
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </button>

            {/* INCOME */}

            <button
              onClick={() => navigate("/income")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                hover:bg-blue-500
                transition
                text-left
              "
            >
              <span>💰</span>
              <span>Income</span>
            </button>

            {/* EXPENSE */}

            <button
              onClick={() => navigate("/expense")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                hover:bg-blue-500
                transition
                text-left
              "
            >
              <span>💳</span>
              <span>Expense</span>
            </button>

            {/* BUDGET */}

            <button
              onClick={() => navigate("/budget")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                hover:bg-blue-500
                transition
                text-left
              "
            >
              <span>📊</span>
              <span>Budget</span>
            </button>

            {/* REPORTS */}

            <button
              onClick={() => navigate("/reports")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                hover:bg-blue-500
                transition
                text-left
              "
            >
              <span>📈</span>
              <span>Reports</span>
            </button>

            {/* ANALYTICS */}

            <button
              onClick={() => navigate("/analytics")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                hover:bg-blue-500
                transition
                text-left
              "
            >
              <span>📉</span>
              <span>Analytics</span>
            </button>

            {/* BANK ACCOUNT */}

            <button
              onClick={() => navigate("/bank-account")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                hover:bg-blue-500
                transition
                text-left
              "
            >
              <span>🏦</span>
              <span>Bank Account</span>
            </button>

            {/* PROFILE */}

            <button
              onClick={() => navigate("/profile")}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                bg-white
                text-blue-600
                font-medium
                text-left
              "
            >
              <span>👤</span>
              <span>Profile</span>
            </button>

          </div>

        </nav>

        {/* LOGOUT */}

        <div className="px-4 py-5 border-t border-blue-500">

          <button
            onClick={logout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-lg
              hover:bg-red-500
              transition
              text-left
            "
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="ml-64 min-h-screen">

        {/* HEADER */}

        <header
          className="
            bg-white
            shadow-sm
            px-8
            py-4
            flex
            justify-between
            items-center
          "
        >

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              My Profile
            </h2>

            <p className="text-sm text-gray-500">
              Manage your account details
            </p>
          </div>

          <div className="flex items-center gap-4">

            <span className="text-gray-600">
              {user?.email}
            </span>

            <button
              onClick={logout}
              className="
                bg-red-500
                hover:bg-red-600
                text-white
                px-4
                py-2
                rounded-lg
              "
            >
              Logout
            </button>

          </div>

        </header>

        {/* CONTENT */}

        <main className="p-8">

          {/* PAGE TITLE */}

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-gray-800">
              Profile
            </h1>

            <p className="text-gray-600 mt-2">
              View and manage your account information
            </p>

          </div>

          {/* PROFILE CARD */}

          <div className="max-w-4xl">

            <div className="bg-white rounded-xl shadow">

              {/* PROFILE HEADER */}

              <div className="p-6 border-b">

                <div className="flex items-center gap-5">

                  <div
                    className="
                      w-20
                      h-20
                      rounded-full
                      bg-blue-100
                      text-blue-600
                      flex
                      items-center
                      justify-center
                      text-3xl
                      font-bold
                    "
                  >
                    {(
                      user?.full_name ||
                      user?.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <h2 className="text-2xl font-bold text-gray-800">
                      {user?.full_name || "User"}
                    </h2>

                    <p className="text-gray-500">
                      {user?.email}
                    </p>

                  </div>

                </div>

              </div>

              {/* ACCOUNT DETAILS */}

              <div className="p-6">

                <h3 className="text-xl font-semibold text-gray-800 mb-6">
                  Account Details
                </h3>

                <div className="space-y-6">

                  {/* NAME */}

                  <div>

                    <div className="flex justify-between items-center mb-2">

                      <label className="font-medium text-gray-700">
                        Full Name
                      </label>

                      {!editingName && (
                        <button
                          onClick={() => setEditingName(true)}
                          className="
                            text-blue-600
                            hover:text-blue-800
                            text-sm
                            font-medium
                          "
                        >
                          Edit
                        </button>
                      )}

                    </div>

                    {!editingName ? (

                      <div
                        className="
                          w-full
                          bg-gray-50
                          border
                          border-gray-200
                          rounded-lg
                          px-4
                          py-3
                          text-gray-800
                        "
                      >
                        {user?.full_name || "Not provided"}
                      </div>

                    ) : (

                      <div>

                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setName(e.target.value)
                          }
                          className="
                            w-full
                            border
                            border-gray-300
                            rounded-lg
                            px-4
                            py-3
                            focus:outline-none
                            focus:ring-2
                            focus:ring-blue-500
                          "
                          placeholder="Enter your full name"
                        />

                        <div className="flex gap-3 mt-3">

                          <button
                            onClick={updateName}
                            disabled={saving}
                            className="
                              bg-blue-600
                              hover:bg-blue-700
                              disabled:bg-blue-300
                              text-white
                              px-5
                              py-2
                              rounded-lg
                            "
                          >
                            {saving
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            onClick={cancelNameEdit}
                            disabled={saving}
                            className="
                              bg-gray-200
                              hover:bg-gray-300
                              text-gray-700
                              px-5
                              py-2
                              rounded-lg
                            "
                          >
                            Cancel
                          </button>

                        </div>

                      </div>

                    )}

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="block font-medium text-gray-700 mb-2">
                      Email Address
                    </label>

                    <div
                      className="
                        w-full
                        bg-gray-100
                        border
                        border-gray-200
                        rounded-lg
                        px-4
                        py-3
                        text-gray-600
                      "
                    >
                      {user?.email || "Not provided"}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Email address cannot be changed.
                    </p>

                  </div>

                  {/* PHONE */}

                  <div>

                    <label className="block font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>

                    <div
                      className="
                        w-full
                        bg-gray-100
                        border
                        border-gray-200
                        rounded-lg
                        px-4
                        py-3
                        text-gray-600
                      "
                    >
                      {user?.phone || "Not provided"}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Phone number cannot be changed.
                    </p>

                  </div>

                  {/* ROLE */}

                  <div>

                    <label className="block font-medium text-gray-700 mb-2">
                      Account Role
                    </label>

                    <div
                      className="
                        w-full
                        bg-gray-100
                        border
                        border-gray-200
                        rounded-lg
                        px-4
                        py-3
                        text-gray-600
                      "
                    >
                      {user?.role || "student"}
                    </div>

                  </div>

                  {/* ACCOUNT STATUS */}

                  <div>

                    <label className="block font-medium text-gray-700 mb-2">
                      Account Status
                    </label>

                    <div
                      className="
                        w-full
                        bg-gray-100
                        border
                        border-gray-200
                        rounded-lg
                        px-4
                        py-3
                        text-gray-600
                      "
                    >
                      {user?.is_active
                        ? "Active"
                        : "Inactive"}
                    </div>

                  </div>

                  {/* CREATED DATE */}

                  <div>

                    <label className="block font-medium text-gray-700 mb-2">
                      Account Created
                    </label>

                    <div
                      className="
                        w-full
                        bg-gray-100
                        border
                        border-gray-200
                        rounded-lg
                        px-4
                        py-3
                        text-gray-600
                      "
                    >
                      {user?.created_at
                        ? new Date(
                            user.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "Not available"}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}