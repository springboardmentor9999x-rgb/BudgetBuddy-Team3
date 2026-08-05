import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      await login(cleanEmail, password);

      toast.success("Login successful.");

      setTimeout(() => {
        navigate("/dashboard");
      }, 600);

    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Invalid email or password.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">

        {/* Left branding section */}

        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12">

          <div className="mb-10">

            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">
                BB
              </span>
            </div>

            <h1 className="text-4xl font-bold">
              BudgetBuddy
            </h1>

            <p className="mt-5 text-blue-100 text-lg leading-relaxed">
              Manage your income, expenses and budgets
              from one simple financial dashboard.
            </p>

          </div>

          <div className="space-y-5">

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span>✓</span>
              </div>
              <span>Track your income</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span>✓</span>
              </div>
              <span>Monitor your expenses</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span>✓</span>
              </div>
              <span>Manage monthly budgets</span>
            </div>

          </div>

        </div>

        {/* Login section */}

        <div className="p-8 sm:p-12 lg:p-14">

          <div className="max-w-md mx-auto">

            {/* Mobile branding */}

            <div className="lg:hidden text-center mb-8">

              <div className="inline-flex w-14 h-14 bg-blue-600 text-white rounded-2xl items-center justify-center mb-4">
                <span className="text-xl font-bold">
                  BB
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900">
                BudgetBuddy
              </h1>

            </div>

            <div className="mb-8">

              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back
              </h2>

              <p className="text-gray-500 mt-2">
                Sign in to continue to your account.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* Email */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

              </div>

              {/* Password */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 pr-20 border border-gray-300 rounded-xl outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-blue-200"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

            </form>

            <div className="relative my-8">

              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-400">
                  New to BudgetBuddy?
                </span>
              </div>

            </div>

            <Link
              to="/signup"
              className="block text-center w-full border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-700 font-semibold py-3 rounded-xl transition"
            >
              Create an account
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}