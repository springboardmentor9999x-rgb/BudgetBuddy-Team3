import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get token from:
  // /reset-password?token=xxxxxxxx
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ==========================================================
  // RESET PASSWORD
  // ==========================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // --------------------------------------------------------
    // CHECK TOKEN
    // --------------------------------------------------------

    if (!token) {
      toast.error(
        "Invalid or missing password reset token."
      );
      return;
    }

    // --------------------------------------------------------
    // CHECK PASSWORD
    // --------------------------------------------------------

    if (!newPassword.trim()) {
      toast.error("Please enter a new password.");
      return;
    }

    if (!confirmPassword.trim()) {
      toast.error("Please confirm your new password.");
      return;
    }

    // --------------------------------------------------------
    // PASSWORD LENGTH
    // --------------------------------------------------------

    if (newPassword.length < 6) {
      toast.error(
        "Password must contain at least 6 characters."
      );
      return;
    }

    // --------------------------------------------------------
    // PASSWORD MATCH
    // --------------------------------------------------------

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // ======================================================
      // CALL BACKEND
      // POST /auth/reset-password
      // ======================================================

      const response = await api.post(
        "/auth/reset-password",
        {
          token: token,
          new_password: newPassword,
        }
      );

      console.log(
        "Password reset response:",
        response.data
      );

      // ======================================================
      // SUCCESS
      // ======================================================

      toast.success(
        "Password reset successfully. You can now login."
      );

      // Clear fields
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to login
      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1500);

    } catch (error) {
      console.error(
        "Password reset failed:",
        error
      );

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      const detail =
        error.response?.data?.detail;

      if (detail) {
        toast.error(detail);
      } else if (error.response?.status === 400) {
        toast.error(
          "The reset link is invalid or has expired."
        );
      } else if (error.response?.status === 404) {
        toast.error(
          "Password reset service was not found."
        );
      } else if (!error.response) {
        toast.error(
          "Unable to connect to the server."
        );
      } else {
        toast.error(
          "Unable to reset password. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INVALID / MISSING TOKEN
  // ==========================================================

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

          <div className="text-center">

            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">
                ⚠️
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Invalid Reset Link
            </h1>

            <p className="text-gray-500 mt-3">
              This password reset link is missing its
              token or is invalid.
            </p>

            <Link
              to="/forgot-password"
              className="
                block
                w-full
                mt-6
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-semibold
                py-3
                rounded-xl
                text-center
                transition
              "
            >
              Request a New Link
            </Link>

            <Link
              to="/login"
              className="
                block
                w-full
                mt-3
                border
                border-gray-300
                hover:bg-gray-50
                text-gray-700
                font-semibold
                py-3
                rounded-xl
                text-center
                transition
              "
            >
              Back to Login
            </Link>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10">

        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="text-center mb-8">

          <div className="inline-flex w-14 h-14 bg-blue-600 text-white rounded-2xl items-center justify-center mb-4">

            <span className="text-xl font-bold">
              BB
            </span>

          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Reset Password
          </h1>

          <p className="text-gray-500 mt-2">
            Create a new password for your BudgetBuddy
            account.
          </p>

        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleResetPassword}
          className="space-y-6"
        >

          {/* ==================================================
              NEW PASSWORD
          ================================================== */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>

            <div className="relative">

              <input
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3.5
                  pr-20
                  border
                  border-gray-300
                  rounded-xl
                  outline-none
                  transition
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-blue-500
                  disabled:bg-gray-100
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    (previous) => !previous
                  )
                }
                disabled={loading}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-sm
                  font-medium
                  text-blue-600
                  hover:text-blue-800
                "
              >
                {showNewPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

            <p className="text-xs text-gray-500 mt-2">
              Password must contain at least 6 characters.
            </p>

          </div>

          {/* ==================================================
              CONFIRM PASSWORD
          ================================================== */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>

            <div className="relative">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3.5
                  pr-20
                  border
                  border-gray-300
                  rounded-xl
                  outline-none
                  transition
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-blue-500
                  disabled:bg-gray-100
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                disabled={loading}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-sm
                  font-medium
                  text-blue-600
                  hover:text-blue-800
                "
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>

          {/* ==================================================
              RESET BUTTON
          ================================================== */}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-blue-400
              text-white
              font-semibold
              py-3.5
              rounded-xl
              transition
              shadow-lg
              shadow-blue-200
            "
          >
            {loading
              ? "Resetting password..."
              : "Reset Password"}
          </button>

        </form>

        {/* ==================================================
            BACK TO LOGIN
        ================================================== */}

        <div className="text-center mt-6">

          <Link
            to="/login"
            className="
              text-sm
              font-medium
              text-blue-600
              hover:text-blue-800
            "
          >
            ← Back to Login
          </Link>

        </div>

      </div>

    </div>
  );
}