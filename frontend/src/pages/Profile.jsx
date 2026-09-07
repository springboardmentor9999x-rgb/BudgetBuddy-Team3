import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  CreditCard,
  Edit2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Star,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import API from "../services/api";
import { useRole } from "../context/RoleContext";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { role, isUser, isPremium, isAdmin, refreshRole, clearAuthSession } = useRole();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Premium request state
  const [premiumRequest, setPremiumRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const [profRes, premRes] = await Promise.all([
        API.get("/users/profile"),
        API.get("/premium/request-status").catch(() => ({ data: null }))
      ]);
      setProfile(profRes.data);
      setName(profRes.data.name || "");
      if (premRes?.data) {
        setPremiumRequest(premRes.data);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await API.put("/users/profile", { name: name.trim() });
      setSuccess("Profile name updated successfully!");
      setIsEditing(false);
      await fetchProfile();
      refreshRole();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Failed to update profile");
    }
  };

  const handleRequestPremium = async () => {
    try {
      setRequestLoading(true);
      setError("");
      const res = await API.post("/premium/request");
      setSuccess(res.data?.message || "Premium upgrade request submitted successfully!");
      setPremiumRequest({
        has_request: true,
        status: "PENDING",
        requested_at: new Date().toISOString()
      });
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Request premium error:", err);
      setError(err.response?.data?.detail || "Failed to submit Premium upgrade request");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  const currentRole = profile?.role || role;

  return (
    <div className="profile-page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header-banner profile-theme glass-card">
        <div>
          <h1>Student Profile & Settings 👤</h1>
          <p>Manage your account identity, security preferences, and membership tier</p>
        </div>
      </div>

      {success && (
        <div className="alert-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-error animate-fade-in">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="profile-layout-grid">
        {/* Left: Avatar Card */}
        <div className="profile-avatar-card glass-card">
          <div className="avatar-big">
            <User size={48} />
          </div>

          <h2>{profile?.name || "Student User"}</h2>
          <p className="profile-email-text">{profile?.email || "-"}</p>

          <span
            className="profile-role-badge"
            style={{
              color:
                currentRole === "ADMIN"
                  ? "#f87171"
                  : currentRole === "PREMIUM_USER"
                  ? "#fbbf24"
                  : "#a5b4fc",
              background:
                currentRole === "ADMIN"
                  ? "rgba(239, 68, 68, 0.15)"
                  : currentRole === "PREMIUM_USER"
                  ? "rgba(245, 158, 11, 0.15)"
                  : "var(--primary-light)",
              border:
                currentRole === "ADMIN"
                  ? "1px solid rgba(239, 68, 68, 0.3)"
                  : currentRole === "PREMIUM_USER"
                  ? "1px solid rgba(245, 158, 11, 0.3)"
                  : "1px solid rgba(99, 102, 241, 0.25)"
            }}
          >
            {currentRole === "ADMIN" ? (
              <>
                <ShieldCheck size={13} /> Administrator Account
              </>
            ) : currentRole === "PREMIUM_USER" ? (
              <>
                <Star size={13} /> Premium Member Plan
              </>
            ) : (
              <>
                <Sparkles size={13} /> Student Edition Plan
              </>
            )}
          </span>

          <div className="avatar-stats-box">
            <div className="stat-line">
              <span>Account Status:</span>
              <strong className="status-active">● Active & Secure</strong>
            </div>
            <div className="stat-line">
              <span>Default Currency:</span>
              <strong>₹ INR (Indian Rupee)</strong>
            </div>
          </div>

          <button onClick={handleLogout} className="btn-danger" style={{ width: "100%" }}>
            <LogOut size={16} /> Sign Out of BudgetBuddy
          </button>
        </div>

        {/* Right: Personal Information & Membership Management */}
        <div className="profile-right-column">
          {/* Personal Information & Edit Form */}
          <div className="profile-details-card glass-card">
            <div className="card-title">
              <Shield size={20} color="#6366f1" />
              <h3>Personal Information</h3>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="custom-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={profile?.email || ""} disabled />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-list">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <strong className="info-val">{profile?.name || "-"}</strong>
                </div>

                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <strong className="info-val">{profile?.email || "-"}</strong>
                </div>

                <div className="info-item">
                  <span className="info-label">Account Role</span>
                  <strong
                    className="info-val"
                    style={{
                      color:
                        currentRole === "ADMIN"
                          ? "#f87171"
                          : currentRole === "PREMIUM_USER"
                          ? "#fbbf24"
                          : "var(--text-main)"
                    }}
                  >
                    {currentRole === "ADMIN"
                      ? "Administrator"
                      : currentRole === "PREMIUM_USER"
                      ? "Premium User ⭐"
                      : "Verified Student"}
                  </strong>
                </div>

                <div className="info-item">
                  <span className="info-label">User ID Identifier</span>
                  <strong className="info-val">#{profile?.user_id || "-"}</strong>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => setIsEditing(true)}
                  style={{ marginTop: "12px", width: "fit-content" }}
                >
                  <Edit2 size={14} /> Edit Profile Information
                </button>
              </div>
            )}
          </div>

          {/* Premium Upgrade Membership Section (Visible for USER role) */}
          {currentRole === "USER" && (
            <div className="profile-upgrade-card glass-card">
              <div className="upgrade-card-header">
                <div className="upgrade-icon-box">
                  <Zap size={22} color="#f59e0b" />
                </div>
                <div className="upgrade-title-area">
                  <h3>Unlock BudgetBuddy Premium ⭐</h3>
                  <p>Elevate your financial analytics with advanced intelligence features</p>
                </div>
              </div>

              <div className="upgrade-perks-grid">
                <div className="perk-item">
                  <span className="perk-dot">✨</span>
                  <div>
                    <strong>Custom Date Range Analytics</strong>
                    <p>Analyze any historical month, quarter, or custom period</p>
                  </div>
                </div>
                <div className="perk-item">
                  <span className="perk-dot">📊</span>
                  <div>
                    <strong>Granular Category Trends</strong>
                    <p>Track multi-category growth and detailed spending patterns</p>
                  </div>
                </div>
                <div className="perk-item">
                  <span className="perk-dot">📥</span>
                  <div>
                    <strong>PDF & Excel Exports</strong>
                    <p>Generate high-resolution financial statements anytime</p>
                  </div>
                </div>
                <div className="perk-item">
                  <span className="perk-dot">🎯</span>
                  <div>
                    <strong>Advanced Savings Tracking</strong>
                    <p>Deep-dive milestone predictions and multi-account breakdown</p>
                  </div>
                </div>
              </div>

              {/* Status Banner / Action Button */}
              <div className="upgrade-action-area">
                {premiumRequest?.status === "PENDING" ? (
                  <div className="request-status-banner pending">
                    <Clock size={18} color="#f59e0b" />
                    <div>
                      <strong>Upgrade Request Pending Review</strong>
                      <p>
                        Your request submitted on{" "}
                        {new Date(premiumRequest.requested_at).toLocaleDateString("en-IN", {
                          dateStyle: "medium"
                        })}{" "}
                        is currently under review by an administrator.
                      </p>
                    </div>
                  </div>
                ) : premiumRequest?.status === "REJECTED" ? (
                  <div className="request-rejected-flow">
                    <div className="request-status-banner rejected">
                      <XCircle size={18} color="#ef4444" />
                      <div>
                        <strong>Previous Request Not Approved</strong>
                        <p>You can submit a new request for administrator review below.</p>
                      </div>
                    </div>
                    <button
                      className="btn-primary upgrade-submit-btn"
                      onClick={handleRequestPremium}
                      disabled={requestLoading}
                    >
                      {requestLoading ? (
                        <span>Submitting Request...</span>
                      ) : (
                        <>
                          <Zap size={16} /> Request Premium Upgrade Again
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-primary upgrade-submit-btn"
                    onClick={handleRequestPremium}
                    disabled={requestLoading}
                  >
                    {requestLoading ? (
                      <span>Submitting Request...</span>
                    ) : (
                      <>
                        <Zap size={16} /> Request Premium Upgrade <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Premium Active Confirmation Card (Visible for PREMIUM_USER role) */}
          {currentRole === "PREMIUM_USER" && (
            <div className="profile-premium-active-card glass-card">
              <div className="prem-active-header">
                <Star size={24} color="#fbbf24" fill="#fbbf24" />
                <div>
                  <h3>Premium Membership Active ⭐</h3>
                  <p>You have full access to all Advanced Analytics, exports, and premium reporting.</p>
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => navigate("/analytics")}
                style={{ marginTop: 14 }}
              >
                Go to Advanced Analytics →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;