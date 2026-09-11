import {
  useEffect,
  useState,
} from "react";

import { toast } from "react-toastify";

import {
  getAdminUsers,
  updateUserRole,
  approvePremiumRequest,
  rejectPremiumRequest,
} from "../api/admin";


export default function UserManagement() {

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);


  // ========================================================
  // LOAD USERS
  // ========================================================

  const loadUsers = async (
    value = search
  ) => {

    try {

      setLoading(true);

      setError("");

      const data =
        await getAdminUsers(
          value
        );

      setUsers(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      setError(
        err.message ||
        "Failed to load users"
      );

    } finally {

      setLoading(false);

    }
  };


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    loadUsers("");

  }, []);


  // ========================================================
  // CHANGE USER ROLE
  // ========================================================

  const handleRoleChange = async (
    userId,
    role
  ) => {

    try {

      setUpdatingId(userId);

      setError("");

      await updateUserRole(
        userId,
        role
      );

      await loadUsers(
        search
      );

    } catch (err) {

      setError(
        err.message ||
        "Failed to update user role"
      );

    } finally {

      setUpdatingId(null);

    }
  };


  // ========================================================
  // ACCEPT / REJECT PREMIUM REQUEST
  // ========================================================

  const handlePremiumRequest = async (
    userId,
    action
  ) => {

    // Prevent another action from being submitted
    // while an existing request is processing.
    if (updatingId !== null) {

      return;

    }

    try {

      setUpdatingId(userId);

      setError("");

      if (action === "approve") {

        await approvePremiumRequest(
          userId
        );

        toast.success(
          "Premium request approved successfully."
        );

      } else {

        await rejectPremiumRequest(
          userId
        );

        toast.success(
          "Premium request rejected."
        );

      }

      // Immediately refresh the User Management
      // list so the role/status/buttons update.
      await loadUsers(
        search
      );

    } catch (err) {

      const message =
        err.response?.data?.detail ||
        err.message ||
        `Failed to ${action} Premium request`;

      setError(message);

      toast.error(message);

    } finally {

      setUpdatingId(null);

    }
  };


  // ========================================================
  // RENDER
  // ========================================================

  return (

    <div className="p-6 space-y-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div>

        <h1 className="text-2xl font-bold">
          User Management
        </h1>

        <p className="text-gray-500">
          Manage Basic and Premium users.
        </p>

      </div>


      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="flex gap-2">

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search by name, email or phone"
          className="border rounded-lg px-4 py-2 flex-1"
        />

        <button
          onClick={() =>
            loadUsers(search)
          }
          className="px-5 py-2 rounded-lg bg-blue-600 text-white"
        >
          Search
        </button>

      </div>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div className="p-3 rounded-lg bg-red-50 text-red-600">

          {error}

        </div>

      )}


      {/* ==================================================
          CONTENT
      ================================================== */}

      {loading ? (

        <p>
          Loading users...
        </p>

      ) : (

        <div className="overflow-x-auto border rounded-xl">

          <table className="w-full">

            {/* ==================================================
                TABLE HEADER
            ================================================== */}

            <thead>

              <tr className="border-b bg-gray-50">

                <th className="text-left p-4">
                  User
                </th>

                <th className="text-left p-4">
                  Email
                </th>

                <th className="text-left p-4">
                  Role
                </th>

                <th className="text-left p-4">
                  Premium Request
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-left p-4">
                  Action
                </th>

              </tr>

            </thead>


            {/* ==================================================
                TABLE BODY
            ================================================== */}

            <tbody>

              {users.map(
                (user) => {

                  // IMPORTANT:
                  // Admin is detected dynamically.
                  //
                  // No email, ID or name is hardcoded.
                  const isAdmin =
                    user.role === "admin";

                  const isPending =
                    !isAdmin &&
                    user.premium_request_status ===
                      "pending";

                  const isProcessing =
                    updatingId === user.id;


                  return (

                    <tr
                      key={user.id}
                      className={`border-b ${
                        isAdmin
                          ? "bg-indigo-50 border-indigo-200"
                          : ""
                      }`}
                    >

                      {/* ==================================================
                          USER
                      ================================================== */}

                      <td className="p-4">

                        <div className="flex items-center gap-2">

                          <span
                            className={
                              isAdmin
                                ? "font-bold text-indigo-900"
                                : ""
                            }
                          >
                            {user.full_name || "—"}
                          </span>


                          {/* ADMIN BADGES */}

                          {isAdmin && (

                            <>

                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">

                                ADMIN

                              </span>


                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white text-indigo-700 border border-indigo-200">

                                PROTECTED

                              </span>

                            </>

                          )}

                        </div>

                      </td>


                      {/* ==================================================
                          EMAIL
                      ================================================== */}

                      <td className="p-4">

                        {user.email}

                      </td>


                      {/* ==================================================
                          ROLE
                      ================================================== */}

                      <td className="p-4 capitalize">

                        <span
                          className={
                            isAdmin
                              ? "font-bold text-indigo-800"
                              : ""
                          }
                        >

                          {user.role}

                        </span>

                      </td>


                      {/* ==================================================
                          PREMIUM REQUEST STATUS
                      ================================================== */}

                      <td className="p-4">

                        {isAdmin ? (

                          <span className="text-gray-400">

                            —

                          </span>

                        ) : user.premium_request_status ? (

                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              user.premium_request_status ===
                              "pending"

                                ? "bg-amber-100 text-amber-800"

                                : user.premium_request_status ===
                                  "approved"

                                  ? "bg-green-100 text-green-800"

                                  : "bg-red-100 text-red-800"
                            }`}
                          >

                            {
                              user.premium_request_status.toUpperCase()
                            }

                          </span>

                        ) : (

                          <span className="text-gray-400">

                            —

                          </span>

                        )}

                      </td>


                      {/* ==================================================
                          ACTIVE STATUS
                      ================================================== */}

                      <td className="p-4">

                        {user.is_active
                          ? "Active"
                          : "Inactive"}

                      </td>


                      {/* ==================================================
                          ACTION
                      ================================================== */}

                      <td className="p-4">

                        {isAdmin ? (

                          // Admin is fully protected.
                          // No role selector.
                          <span className="text-gray-500 font-medium">

                            Protected

                          </span>

                        ) : (

                          <div className="flex flex-wrap items-center gap-2">

                            {/* ==================================================
                                ACCEPT / REJECT
                                ONLY FOR PENDING REQUESTS
                            ================================================== */}

                            {isPending && (

                              <>

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing ||
                                    updatingId !== null
                                  }
                                  onClick={() =>
                                    handlePremiumRequest(
                                      user.id,
                                      "approve"
                                    )
                                  }
                                  className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >

                                  {
                                    isProcessing
                                      ? "Processing..."
                                      : "ACCEPT"
                                  }

                                </button>


                                <button
                                  type="button"
                                  disabled={
                                    isProcessing ||
                                    updatingId !== null
                                  }
                                  onClick={() =>
                                    handlePremiumRequest(
                                      user.id,
                                      "reject"
                                    )
                                  }
                                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >

                                  {
                                    isProcessing
                                      ? "Processing..."
                                      : "REJECT"
                                  }

                                </button>

                              </>

                            )}


                            {/* ==================================================
                                EXISTING ROLE MANAGEMENT
                            ================================================== */}

                            <select
                              value={user.role}
                              disabled={
                                isProcessing ||
                                updatingId !== null
                              }
                              onChange={(e) =>
                                handleRoleChange(
                                  user.id,
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                            >

                              <option value="user">
                                Basic
                              </option>

                              <option value="premium">
                                Premium
                              </option>

                            </select>

                          </div>

                        )}

                      </td>

                    </tr>

                  );

                }
              )}


              {/* ==================================================
                  EMPTY RESULT
              ================================================== */}

              {users.length === 0 && (

                <tr>

                  <td
                    colSpan="6"
                    className="p-8 text-center text-gray-500"
                  >

                    No users found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );
}