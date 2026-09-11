import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying");

  // Prevent React StrictMode from sending the verification
  // request twice during development.
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        const response = await api.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        console.log("Email verification response:", response.data);

        setStatus("success");

        toast.success(
          "Email verified successfully!"
        );
      } catch (error) {
        console.error(
          "Email verification failed:",
          error
        );

        setStatus("error");

        toast.error(
          error.response?.data?.detail ||
            "Invalid or expired verification link."
        );
      }
    };

    verifyEmail();
  }, [token]);

  // ==========================================================
  // VERIFYING
  // ==========================================================

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">

          <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">

            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />

          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Verifying your email
          </h1>

          <p className="text-gray-500 mt-3">
            Please wait while we verify your
            email address...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================================
  // SUCCESS
  // ==========================================================

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">

          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">

            <span className="text-4xl text-green-600">
              ✓
            </span>

          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Email Verified!
          </h1>

          <p className="text-gray-500 mt-3 leading-relaxed">
            Your email address has been
            successfully verified.
          </p>

          <p className="text-gray-500 mt-2">
            You can now login to your
            BudgetBuddy account.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="
              w-full
              mt-8
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-semibold
              py-3.5
              rounded-xl
              transition
              shadow-lg
              shadow-blue-200
            "
          >
            Go to Login
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // INVALID TOKEN
  // ==========================================================

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">

          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">

            <span className="text-4xl text-red-600">
              !
            </span>

          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Invalid Verification Link
          </h1>

          <p className="text-gray-500 mt-3">
            The verification link is missing
            or invalid.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="
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
            Go to Login
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // ERROR / EXPIRED TOKEN
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">

        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">

          <span className="text-4xl text-red-600">
            ✕
          </span>

        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Verification Failed
        </h1>

        <p className="text-gray-500 mt-3 leading-relaxed">
          This verification link may have
          expired or already been used.
        </p>

        <div className="space-y-3 mt-8">

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-semibold
              py-3.5
              rounded-xl
              transition
            "
          >
            Go to Login
          </button>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="
              w-full
              border-2
              border-gray-200
              hover:border-blue-500
              hover:text-blue-600
              text-gray-700
              font-semibold
              py-3.5
              rounded-xl
              transition
            "
          >
            Create New Account
          </button>

        </div>

      </div>

    </div>
  );
}