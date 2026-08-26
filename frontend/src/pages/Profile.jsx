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
  Sparkles
} from "lucide-react";
import API from "../services/api";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/users/profile");
      setProfile(res.data);
      setName(res.data.name || "");
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
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Failed to update profile");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="profile-page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header-banner profile-theme glass-card">
        <div>
          <h1>Student Profile & Settings 👤</h1>
          <p>Manage your account identity, security preferences, and student plan</p>
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

          <span className="profile-role-badge">
            <Sparkles size={12} /> Student Edition Plan
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

        {/* Right: Personal Information & Edit Form */}
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
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
                <small style={{ color: "#64748b", fontSize: "11px" }}>
                  Email address cannot be changed once verified.
                </small>
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
                <strong className="info-val">Verified Student</strong>
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
      </div>
    </div>
  );
}

export default Profile;