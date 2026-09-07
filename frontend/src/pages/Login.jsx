import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import API from "../services/api";
import { useRole } from "../context/RoleContext";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { setAuthSession, refreshRole } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const response = await API.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Save token and sync role in RoleContext immediately
      const token = response.data.access_token;
      const userRole = response.data.role || "USER";

      setAuthSession({
        token,
        role: userRole,
        userEmail: email.trim()
      });

      // Refresh full profile in background
      refreshRole();

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-fullscreen-container">
      {/* Background glow orbs */}
      <div className="auth-glow-orb orb-1"></div>
      <div className="auth-glow-orb orb-2"></div>

      <div className="auth-box-card glass-card animate-fade-in">
        {/* Brand Header */}
        <div className="auth-brand-head">
          <div className="auth-logo-icon">💰</div>
          <h1>Budget<span>Buddy</span></h1>
          <p className="auth-tagline">
            Personal Budget Planning & Expense Management Platform
          </p>
        </div>

        <div className="auth-welcome-text">
          <h2>Welcome Back! 👋</h2>
          <p>Enter your credentials to access your financial dashboard</p>
        </div>

        {error && (
          <div className="alert-error animate-fade-in" style={{ marginBottom: "16px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. student@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Create Student Account →
            </Link>
          </p>
          <small className="auth-security-notice">
            🛡️ 256-bit JWT Secure Authentication & Isolated Data
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;