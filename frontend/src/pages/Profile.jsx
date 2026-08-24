import {
  useEffect,
  useState,
} from "react";

import {
  toast,
} from "react-toastify";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import api from "../api/axios";


export default function Profile() {

  const {
    user,
    updateUser,
    deleteAccount,
  } = useAuth();


  const navigate =
    useNavigate();


  // ==========================================================
  // EDITING STATE
  // ==========================================================

  const [
    editingProfile,
    setEditingProfile
  ] = useState(false);


  const [
    saving,
    setSaving
  ] = useState(false);


  const [
    deletingAccount,
    setDeletingAccount
  ] = useState(false);


  // ==========================================================
  // DELETE MODAL
  // ==========================================================

  const [
    showDeleteModal,
    setShowDeleteModal
  ] = useState(false);


  // ==========================================================
  // PROFILE FORM
  // ==========================================================

  const [
    name,
    setName
  ] = useState(
    user?.full_name || ""
  );


  const [
    phone,
    setPhone
  ] = useState(
    user?.phone || ""
  );


  const [
    role,
    setRole
  ] = useState(
    user?.role || "student"
  );


  // ==========================================================
  // KEEP FORM IN SYNC WITH USER
  // ==========================================================

  useEffect(() => {

    setName(
      user?.full_name || ""
    );

    setPhone(
      user?.phone || ""
    );

    setRole(
      user?.role || "student"
    );

  }, [
    user?.full_name,
    user?.phone,
    user?.role,
  ]);


  // ==========================================================
  // UPDATE PROFILE
  // ==========================================================

  const updateProfile = async () => {

    const newName =
      name.trim();


    const newPhone =
      phone.trim();


    const newRole =
      role.trim();


    // --------------------------------------------------------
    // NAME VALIDATION
    // --------------------------------------------------------

    if (!newName) {

      toast.error(
        "Name cannot be empty"
      );

      return;
    }


    if (
      newName.length < 2
    ) {

      toast.error(
        "Name must contain at least 2 characters"
      );

      return;
    }


    // --------------------------------------------------------
    // PHONE VALIDATION
    // --------------------------------------------------------

    if (
      newPhone &&
      !/^\d{10}$/.test(
        newPhone
      )
    ) {

      toast.error(
        "Phone number must contain exactly 10 digits"
      );

      return;
    }


    // --------------------------------------------------------
    // ROLE VALIDATION
    // --------------------------------------------------------

    if (!newRole) {

      toast.error(
        "Please select a role"
      );

      return;
    }


    try {

      setSaving(true);


      const response =
        await api.put(
          "/auth/me/profile",
          {
            full_name:
              newName,

            phone:
              newPhone || null,

            role:
              newRole,
          }
        );


      // ------------------------------------------------------
      // UPDATE AUTH CONTEXT
      // ------------------------------------------------------

      if (user) {

        updateUser({

          ...user,

          full_name:
            response.data.full_name,

          phone:
            response.data.phone,

          role:
            response.data.role,

        });

      }


      // ------------------------------------------------------
      // UPDATE FORM
      // ------------------------------------------------------

      setName(
        response.data.full_name || ""
      );


      setPhone(
        response.data.phone || ""
      );


      setRole(
        response.data.role ||
        "student"
      );


      setEditingProfile(
        false
      );


      toast.success(
        "Profile updated successfully"
      );

    } catch (error) {

      console.error(
        "Failed to update profile:",
        error
      );


      toast.error(
        error.response?.data?.detail ||
        "Failed to update profile"
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  const cancelEdit = () => {

    setName(
      user?.full_name || ""
    );


    setPhone(
      user?.phone || ""
    );


    setRole(
      user?.role || "student"
    );


    setEditingProfile(
      false
    );

  };


  // ==========================================================
  // OPEN DELETE MODAL
  // ==========================================================

  const openDeleteModal = () => {

    if (
      deletingAccount ||
      saving
    ) {

      return;
    }


    setShowDeleteModal(
      true
    );

  };


  // ==========================================================
  // CLOSE DELETE MODAL
  // ==========================================================

  const closeDeleteModal = () => {

    if (
      deletingAccount
    ) {

      return;
    }


    setShowDeleteModal(
      false
    );

  };


  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  const handleDeleteAccount = async () => {

    try {

      setDeletingAccount(
        true
      );


      // ------------------------------------------------------
      // DELETE EVERYTHING FROM BACKEND
      // ------------------------------------------------------

      await deleteAccount();


      // ------------------------------------------------------
      // CLOSE MODAL
      // ------------------------------------------------------

      setShowDeleteModal(
        false
      );


      // ------------------------------------------------------
      // SUCCESS MESSAGE
      // ------------------------------------------------------

      toast.success(
        "Your account and all associated data have been deleted."
      );


      // ------------------------------------------------------
      // REDIRECT
      // ------------------------------------------------------

      navigate(
        "/login",
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        "Failed to delete account:",
        error
      );


      toast.error(
        error.response?.data?.detail ||
        "Failed to delete account"
      );

    } finally {

      setDeletingAccount(
        false
      );

    }

  };


  // ==========================================================
  // FORMAT CREATED DATE
  // ==========================================================

  const formatCreatedDate = (
    date
  ) => {

    if (!date) {

      return "Not available";

    }


    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return "Not available";

    }


    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  // ==========================================================
  // PROFILE CONTENT
  // ==========================================================

  return (

    <div className="w-full">


      {/* ====================================================
          PAGE TITLE
      ==================================================== */}

      <div className="max-w-5xl mx-auto mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Profile
        </h1>

        <p className="text-gray-600 mt-2">
          View and manage your account information
        </p>

      </div>


      {/* ====================================================
          PROFILE CARD
      ==================================================== */}

      <div className="max-w-5xl mx-auto">

        <div className="bg-white rounded-xl shadow">


          {/* ==================================================
              PROFILE HEADER
          ================================================== */}

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


              <div>

                <h2 className="text-2xl font-bold text-gray-800">
                  {user?.full_name ||
                    "User"}
                </h2>

                <p className="text-gray-500">
                  {user?.email ||
                    "Not provided"}
                </p>

              </div>

            </div>

          </div>


          {/* ==================================================
              ACCOUNT DETAILS
          ================================================== */}

          <div className="p-6">

            <div className="flex justify-between items-center mb-6">

              <h3 className="text-xl font-semibold text-gray-800">
                Account Details
              </h3>


              {!editingProfile && (

                <button
                  type="button"
                  onClick={() =>
                    setEditingProfile(
                      true
                    )
                  }
                  disabled={
                    deletingAccount
                  }
                  className="
                    text-blue-600
                    hover:text-blue-800
                    font-medium
                    disabled:text-gray-400
                  "
                >
                  Edit
                </button>

              )}

            </div>


            <div className="space-y-6">


              {/* FULL NAME */}

              <div>

                <label className="block font-medium text-gray-700 mb-2">
                  Full Name
                </label>


                {editingProfile ? (

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

                ) : (

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
                  {user?.email ||
                    "Not provided"}
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


                {editingProfile ? (

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {

                      const value =
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            10
                          );

                      setPhone(
                        value
                      );

                    }}
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
                    placeholder="Enter 10 digit phone number"
                    maxLength={10}
                  />

                ) : (

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
                    {user?.phone ||
                      "Not provided"}
                  </div>

                )}

              </div>


              {/* ACCOUNT ROLE */}

              <div>

                <label className="block font-medium text-gray-700 mb-2">
                  Account Role
                </label>


                {editingProfile ? (

                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(
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
                      bg-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      disabled:bg-gray-100
                    "
                  >

                    <option value="student">
                      Student
                    </option>

                    <option value="employee">
                      Employee
                    </option>

                    <option value="professional">
                      Professional
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                ) : (

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
                      capitalize
                    "
                  >
                    {user?.role ||
                      "student"}
                  </div>

                )}

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

                <p className="text-xs text-gray-500 mt-2">
                  Account status is managed by the system.
                </p>

              </div>


              {/* ACCOUNT CREATED */}

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


              {/* SAVE / CANCEL */}

              {editingProfile && (

                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    onClick={
                      updateProfile
                    }
                    disabled={
                      saving ||
                      deletingAccount
                    }
                    className="
                      bg-blue-600
                      hover:bg-blue-700
                      disabled:bg-blue-300
                      text-white
                      px-6
                      py-2.5
                      rounded-lg
                      transition
                    "
                  >

                    {saving
                      ? "Saving..."
                      : "Save Changes"}

                  </button>


                  <button
                    type="button"
                    onClick={
                      cancelEdit
                    }
                    disabled={
                      saving ||
                      deletingAccount
                    }
                    className="
                      bg-gray-200
                      hover:bg-gray-300
                      disabled:bg-gray-100
                      text-gray-700
                      px-6
                      py-2.5
                      rounded-lg
                      transition
                    "
                  >
                    Cancel
                  </button>

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              DANGER ZONE
          ================================================== */}

          <div
            className="
              p-6
              border-t
              border-red-200
              bg-red-50
              rounded-b-xl
            "
          >

            <h3 className="text-xl font-semibold text-red-700">
              Delete Account
            </h3>


            <p className="text-sm text-red-600 mt-2">
              Permanently delete your BudgetBuddy account
              and all associated data.
            </p>


            <p className="text-sm text-gray-600 mt-3">
              This includes your profile, income, expenses,
              budgets, bank accounts, savings goals and
              notifications. This action cannot be undone.
            </p>


            <button
              type="button"
              onClick={
                openDeleteModal
              }
              disabled={
                deletingAccount ||
                saving
              }
              className="
                mt-5
                bg-red-600
                hover:bg-red-700
                disabled:bg-red-300
                text-white
                px-6
                py-2.5
                rounded-lg
                font-medium
                transition
              "
            >

              Delete Account

            </button>

          </div>

        </div>

      </div>


      {/* ======================================================
          CUSTOM DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteModal && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black
            bg-opacity-50
            px-4
          "
        >

          <div
            className="
              w-full
              max-w-lg
              bg-white
              rounded-xl
              shadow-2xl
              p-6
            "
          >

            {/* ------------------------------------------------
                MODAL HEADER
            ------------------------------------------------ */}

            <div className="flex items-start gap-4">

              <div
                className="
                  flex-shrink-0
                  w-12
                  h-12
                  rounded-full
                  bg-red-100
                  text-red-600
                  flex
                  items-center
                  justify-center
                  text-2xl
                "
              >
                !
              </div>


              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  Delete your account?
                </h2>

                <p className="text-gray-600 mt-1">
                  This action is permanent and cannot be undone.
                </p>

              </div>

            </div>


            {/* ------------------------------------------------
                DATA WARNING
            ------------------------------------------------ */}

            <div
              className="
                mt-5
                bg-red-50
                border
                border-red-200
                rounded-lg
                p-4
              "
            >

              <p className="font-medium text-red-700 mb-2">
                The following will be permanently deleted:
              </p>


              <ul
                className="
                  list-disc
                  list-inside
                  text-sm
                  text-gray-700
                  space-y-1
                "
              >

                <li>Profile information</li>

                <li>All income records</li>

                <li>All expense records</li>

                <li>All budgets</li>

                <li>All savings goals</li>

                <li>All bank accounts</li>

                <li>All notifications</li>

                <li>Your BudgetBuddy account</li>

              </ul>

            </div>


            {/* ------------------------------------------------
                MODAL BUTTONS
            ------------------------------------------------ */}

            <div
              className="
                flex
                justify-end
                gap-3
                mt-6
              "
            >

              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deletingAccount
                }
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-gray-200
                  hover:bg-gray-300
                  disabled:bg-gray-100
                  text-gray-700
                  font-medium
                "
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleDeleteAccount
                }
                disabled={
                  deletingAccount
                }
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-red-600
                  hover:bg-red-700
                  disabled:bg-red-300
                  text-white
                  font-medium
                "
              >

                {deletingAccount
                  ? "Deleting..."
                  : "Delete Permanently"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}