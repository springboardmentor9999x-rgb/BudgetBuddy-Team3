import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Profile() {
  const {
    user,
    updateUser,
  } = useAuth();

  const [editingName, setEditingName] = useState(false);

  const [name, setName] = useState(
    user?.full_name || ""
  );

  const [saving, setSaving] = useState(false);

  // ==========================================================
  // KEEP NAME IN SYNC WITH USER
  // ==========================================================

  useEffect(() => {
    setName(user?.full_name || "");
  }, [user?.full_name]);

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
      toast.error(
        "Name must contain at least 2 characters"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        "/auth/me/name",
        {
          full_name: newName,
        }
      );

      // Update AuthContext
      if (user) {
        updateUser({
          ...user,
          full_name: response.data.full_name,
        });
      }

      setName(response.data.full_name);

      setEditingName(false);

      toast.success(
        "Name updated successfully"
      );

    } catch (error) {
      console.error(
        "Failed to update name:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to update name"
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  const cancelNameEdit = () => {
    setName(user?.full_name || "");
    setEditingName(false);
  };

  // ==========================================================
  // FORMAT CREATED DATE
  // ==========================================================

  const formatCreatedDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==========================================================
  // PROFILE CONTENT ONLY
  //
  // Sidebar and top header are provided by Layout.jsx
  // ==========================================================

  return (
    <div className="w-full">

      {/* =====================================================
          PAGE TITLE
      ===================================================== */}

      <div className="max-w-5xl mx-auto mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Profile
        </h1>

        <p className="text-gray-600 mt-2">
          View and manage your account information
        </p>

      </div>

      {/* =====================================================
          PROFILE CARD
      ===================================================== */}

      <div className="max-w-5xl mx-auto">

        <div className="bg-white rounded-xl shadow">

          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <div className="p-6 border-b">

            <div className="flex items-center gap-5">

              {/* PROFILE INITIAL */}

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
                  flex-shrink-0
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

              {/* USER INFORMATION */}

              <div>

                <h2 className="text-2xl font-bold text-gray-800">
                  {user?.full_name || "User"}
                </h2>

                <p className="text-gray-500">
                  {user?.email || "Not provided"}
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              ACCOUNT DETAILS
          ================================================= */}

          <div className="p-6">

            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Account Details
            </h3>

            <div className="space-y-6">

              {/* =================================================
                  FULL NAME
              ================================================= */}

              <div>

                <div className="flex justify-between items-center mb-2">

                  <label className="font-medium text-gray-700">
                    Full Name
                  </label>

                  {!editingName && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingName(true)
                      }
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
                    {user?.full_name ||
                      "Not provided"}
                  </div>

                ) : (

                  <div>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      disabled={saving}
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
                        disabled:bg-gray-100
                      "
                      placeholder="Enter your full name"
                    />

                    <div className="flex gap-3 mt-3">

                      {/* SAVE */}

                      <button
                        type="button"
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
                          transition
                        "
                      >
                        {saving
                          ? "Saving..."
                          : "Save"}
                      </button>

                      {/* CANCEL */}

                      <button
                        type="button"
                        onClick={cancelNameEdit}
                        disabled={saving}
                        className="
                          bg-gray-200
                          hover:bg-gray-300
                          disabled:bg-gray-100
                          text-gray-700
                          px-5
                          py-2
                          rounded-lg
                          transition
                        "
                      >
                        Cancel
                      </button>

                    </div>

                  </div>

                )}

              </div>

              {/* =================================================
                  EMAIL
              ================================================= */}

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
                  {user?.email ||
                    "Not provided"}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Email address cannot be changed.
                </p>

              </div>

              {/* =================================================
                  PHONE
              ================================================= */}

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
                  {user?.phone ||
                    "Not provided"}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Phone number cannot be changed.
                </p>

              </div>

              {/* =================================================
                  ROLE
              ================================================= */}

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
                  {user?.role ||
                    "student"}
                </div>

              </div>

              {/* =================================================
                  ACCOUNT STATUS
              ================================================= */}

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

              {/* =================================================
                  CREATED DATE
              ================================================= */}

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
                  {formatCreatedDate(
                    user?.created_at
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}