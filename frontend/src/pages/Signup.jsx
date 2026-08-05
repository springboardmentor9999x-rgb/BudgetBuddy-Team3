import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };

  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;

  const getStrength = () => {
    if (!form.password) {
      return { text: "", width: "0%" };
    }

    if (strengthScore <= 2) {
      return { text: "Weak", width: "40%" };
    }

    if (strengthScore === 3 || strengthScore === 4) {
      return { text: "Medium", width: "70%" };
    }

    return { text: "Strong", width: "100%" };
  };

  const strength = getStrength();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordChecks.length) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (!passwordChecks.uppercase) {
      toast.error("Password must contain an uppercase letter.");
      return;
    }

    if (!passwordChecks.lowercase) {
      toast.error("Password must contain a lowercase letter.");
      return;
    }

    if (!passwordChecks.number) {
      toast.error("Password must contain a number.");
      return;
    }

    if (!passwordChecks.special) {
      toast.error("Password must contain a special character.");
      return;
    }

    try {
      await signup(form);

      toast.success("Account created successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      const message =
        err.response?.data?.detail || "Signup failed. Please try again.";

      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            BudgetBuddy
          </h1>

          <p className="text-gray-500 mt-2">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              required
            />

            <p className="text-xs text-gray-500 mt-1">
              Enter a valid email address.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {form.password && (
              <div className="mt-3">

                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    Password strength
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      strength.text === "Strong"
                        ? "text-green-600"
                        : strength.text === "Medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {strength.text}
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength.text === "Strong"
                        ? "bg-green-500"
                        : strength.text === "Medium"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: strength.width }}
                  />
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <p className={passwordChecks.length ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.length ? "✓" : "○"} At least 8 characters
                  </p>

                  <p className={passwordChecks.uppercase ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.uppercase ? "✓" : "○"} One uppercase letter
                  </p>

                  <p className={passwordChecks.lowercase ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.lowercase ? "✓" : "○"} One lowercase letter
                  </p>

                  <p className={passwordChecks.number ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.number ? "✓" : "○"} One number
                  </p>

                  <p className={passwordChecks.special ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.special ? "✓" : "○"} One special character
                  </p>
                </div>

              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-md hover:shadow-lg"
          >
            Create Account
          </button>

        </form>

        <div className="text-center mt-6 text-sm">
          <span className="text-gray-600">
            Already have an account?
          </span>

          <Link
            to="/login"
            className="text-green-600 font-semibold ml-2 hover:text-green-700"
          >
            Login
          </Link>
        </div>

      </div>
    </div>
  );
}