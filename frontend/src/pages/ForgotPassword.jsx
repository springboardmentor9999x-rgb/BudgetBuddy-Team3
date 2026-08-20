import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    // ------------------------------------------------------
    // VALIDATE EMAIL
    // ------------------------------------------------------

    if (!cleanEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      // ----------------------------------------------------
      // SEND FORGOT PASSWORD REQUEST
      // ----------------------------------------------------

      const response = await api.post(
        "/auth/forgot-password",
        {
          email: cleanEmail,
        }
      );

      toast.success(
        response.data?.message ||
          "If the email exists, a password reset link has been sent."
      );

      setSubmitted(true);

    } catch (error) {
      console.error(
        "Forgot password request failed:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Unable to process your request. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* ==================================================
            CARD
        ================================================== */}

        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">

          {/* =================================================
              LOGO
          ================================================= */}

          <div className="text-center mb-8">

            <div className="inline-flex w-14 h-14 bg-blue-600 text-white rounded-2xl items-center justify-center mb-4">

              <span className="text-xl font-bold">
                BB
              </span>

            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              BudgetBuddy
            </h1>

          </div>

          {/* =================================================
              SUCCESS STATE
          ================================================= */}

          {submitted ? (

            <div className="text-center">

              {/* EMAIL ICON */}

              <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">

                <span className="text-3xl">
                  ✉️
                </span>

              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Check your email
              </h2>

              <p className="text-gray-500 mt-3 leading-relaxed">

                If an account exists with{" "}

                <span className="font-medium text-gray-700">
                  {email.trim()}
                </span>

                , we've sent a password reset link.

              </p>

              <p className="text-sm text-gray-400 mt-4">
                Please check your inbox and spam folder.
              </p>

              {/* LOGIN */}

              <Link
                to="/login"
                className="
                  block
                  w-full
                  mt-8
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  font-semibold
                  py-3.5
                  rounded-xl
                  transition
                "
              >
                Back to Login
              </Link>

              {/* TRY AGAIN */}

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="
                  mt-4
                  text-blue-600
                  hover:text-blue-800
                  text-sm
                  font-medium
                "
              >
                Try another email
              </button>

            </div>

          ) : (

            <>
              {/* =============================================
                  HEADING
              ============================================= */}

              <div className="mb-8">

                <h2 className="text-3xl font-bold text-gray-900">
                  Forgot password?
                </h2>

                <p className="text-gray-500 mt-2 leading-relaxed">
                  Enter the email address associated with your
                  account and we'll send you a password reset
                  link.
                </p>

              </div>

              {/* =============================================
                  FORM
              ============================================= */}

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* EMAIL */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="john@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="
                      w-full
                      px-4
                      py-3.5
                      border
                      border-gray-300
                      rounded-xl
                      outline-none
                      transition
                      focus:ring-2
                      focus:ring-blue-500
                      focus:border-blue-500
                      disabled:bg-gray-100
                      disabled:cursor-not-allowed
                    "
                  />

                </div>

                {/* SUBMIT */}

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
                    ? "Sending..."
                    : "Send reset link"}
                </button>

              </form>

              {/* =============================================
                  BACK TO LOGIN
              ============================================= */}

              <div className="text-center mt-8">

                <Link
                  to="/login"
                  className="
                    text-blue-600
                    hover:text-blue-800
                    font-medium
                    text-sm
                  "
                >
                  ← Back to Login
                </Link>

              </div>

            </>

          )}

        </div>

      </div>

    </div>
  );
}

