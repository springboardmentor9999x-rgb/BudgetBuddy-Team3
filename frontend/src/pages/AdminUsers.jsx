import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Shield,
  Star,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  UserCheck,
  UserX,
  Zap,
  ChevronRight,
  Trash2
} from "lucide-react";
import API, { notifyDataChanged } from "../services/api";
import { useRole } from "../context/RoleContext";
import "./AdminUsers.css";

export default function AdminUsers() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useRole();

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | USER | PREMIUM_USER | ADMIN

  // Highlight targets
  const queryParams = new URLSearchParams(location.search);
  const highlightUserId = queryParams.get("highlightUser");
  const highlightRequestId = queryParams.get("requestId");

  const highlightedRowRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, reqsRes] = await Promise.all([
        API.get("/admin/users"),
        API.get("/admin/premium-requests")
      ]);
      setUsers(usersRes.data || []);
      setRequests(reqsRes.data || []);
    } catch (err) {
      console.error("Admin users load error:", err);
      if (err.response?.status === 403) {
        setError("Access denied. Administrator privileges required.");
      } else {
        setError("Failed to load user management data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [isAdmin, roleLoading]);

  // Scroll to highlighted row once loaded
  useEffect(() => {
    if (!loading && (highlightUserId || highlightRequestId)) {
      setTimeout(() => {
        if (highlightedRowRef.current) {
          highlightedRowRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }
      }, 300);
    }
  }, [loading, highlightUserId, highlightRequestId]);

  // Handle Approve Request
  const handleApprove = async (requestId, userName) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: "approving" }));
    setError(null);
    try {
      const res = await API.post(`/admin/premium-requests/${requestId}/approve`);
      setSuccess(res.data?.message || `Approved Premium upgrade for ${userName}.`);
      await fetchData();
      notifyDataChanged({ type: "premium_approved" });
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.response?.data?.detail || "Failed to approve request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: null }));
    }
  };

  // Handle Reject Request
  const handleReject = async (requestId, userName) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: "rejecting" }));
    setError(null);
    try {
      const res = await API.post(`/admin/premium-requests/${requestId}/reject`);
      setSuccess(res.data?.message || `Rejected Premium upgrade request #${requestId}.`);
      await fetchData();
      notifyDataChanged({ type: "premium_rejected" });
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.response?.data?.detail || "Failed to reject request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: null }));
    }
  };

  // Handle Direct Role Change
  const handleDirectRoleChange = async (userId, newRole, userName) => {
    setActionLoading((prev) => ({ ...prev, [`user-${userId}`]: true }));
    setError(null);
    try {
      const res = await API.put(`/admin/users/${userId}/role`, { role: newRole });
      setSuccess(res.data?.message || `Updated ${userName}'s role to ${newRole}.`);
      await fetchData();
      notifyDataChanged({ type: "role_updated" });
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Role change error:", err);
      setError(err.response?.data?.detail || "Failed to update role.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`user-${userId}`]: false }));
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId, userName) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    if (!confirmed) return;

    setActionLoading((prev) => ({ ...prev, [`delete-${userId}`]: true }));
    setError(null);
    try {
      const res = await API.delete(`/admin/users/${userId}`);
      setSuccess(res.data?.message || `User '${userName}' was successfully deleted.`);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      await fetchData();
      notifyDataChanged({ type: "user_deleted", userId });
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err.response?.data?.detail || "Failed to delete user.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete-${userId}`]: false }));
    }
  };


  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

  const totalUsers = users.length;
  const standardUsers = users.filter((u) => u.role === "USER").length;
  const premiumUsers = users.filter((u) => u.role === "PREMIUM_USER").length;
  const adminUsers = users.filter((u) => u.role === "ADMIN").length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors = {
    ADMIN: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)", label: "Administrator", icon: Shield },
    PREMIUM_USER: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "Premium Member", icon: Star },
    USER: { bg: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "rgba(99,102,241,0.25)", label: "Student", icon: Sparkles },
  };

  if (roleLoading || (loading && users.length === 0)) {
    return (
      <div className="admin-users-page animate-fade-in">
        <div className="page-header-banner admin-theme glass-card">
          <div>
            <h1>User Management & Permissions 👥</h1>
            <p>Review upgrade requests and manage platform member roles</p>
          </div>
        </div>
        <div className="admin-loading-box">
          <div className="spinner"></div>
          <p>Loading user accounts and access requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page animate-fade-in">
      {/* Header Banner */}
      <div className="page-header-banner admin-theme glass-card">
        <div>
          <div className="admin-badge-pill">
            <Shield size={13} /> Administrator Console
          </div>
          <h1>User Management & Permissions 👥</h1>
          <p>Review student upgrade requests, assign permissions, and oversee platform access</p>
        </div>
        <button onClick={fetchData} className="btn-secondary admin-refresh-btn" title="Refresh data">
          <RefreshCw size={15} /> Refresh
        </button>
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

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-box total">
            <Users size={22} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Total Accounts</span>
            <h2 className="stat-val">{totalUsers}</h2>
            <span className="stat-sub">Registered platform users</span>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-box pending-box">
            <Clock size={22} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Pending Upgrades</span>
            <h2 className="stat-val pending-color">{pendingRequests.length}</h2>
            <span className="stat-sub">Awaiting administrator approval</span>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-box premium">
            <Star size={22} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Premium Members</span>
            <h2 className="stat-val premium-color">{premiumUsers}</h2>
            <span className="stat-sub">Advanced Analytics unlocked</span>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-box student">
            <Sparkles size={22} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Student Users</span>
            <h2 className="stat-val student-color">{standardUsers}</h2>
            <span className="stat-sub">Standard tier accounts</span>
          </div>
        </div>
      </div>

      {/* Pending Upgrade Requests Section */}
      <div className="admin-section">
        <div className="section-header-flex">
          <div className="section-title-area">
            <Zap size={20} color="#f59e0b" />
            <h2>Pending Premium Upgrade Requests</h2>
            {pendingRequests.length > 0 && (
              <span className="pending-count-pill">{pendingRequests.length} Action Needed</span>
            )}
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="admin-empty-card glass-card">
            <CheckCircle2 size={32} color="#10b981" />
            <h3>No Pending Upgrade Requests</h3>
            <p>All student premium requests have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="admin-table-card glass-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => {
                    const isTarget =
                      String(req.user_id) === String(highlightUserId) ||
                      String(req.request_id) === String(highlightRequestId);
                    return (
                      <tr
                        key={req.request_id}
                        ref={isTarget ? highlightedRowRef : null}
                        className={`request-row ${isTarget ? "highlighted-row" : ""}`}
                      >
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">
                              {req.user_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <span className="user-name-bold">{req.user_name}</span>
                          </div>
                        </td>
                        <td className="email-cell">{req.user_email}</td>
                        <td>
                          <span className="role-tag student">
                            <Sparkles size={11} /> {req.current_role}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(req.requested_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })}
                        </td>
                        <td>
                          <span className="status-tag pending">
                            <Clock size={12} /> Pending Review
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              className="btn-approve"
                              onClick={() => handleApprove(req.request_id, req.user_name)}
                              disabled={actionLoading[req.request_id] !== undefined && actionLoading[req.request_id] !== null}
                              title="Approve Premium upgrade"
                            >
                              {actionLoading[req.request_id] === "approving" ? (
                                <span>Approving...</span>
                              ) : (
                                <>
                                  <Check size={14} /> Approve
                                </>
                              )}
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleReject(req.request_id, req.user_name)}
                              disabled={actionLoading[req.request_id] !== undefined && actionLoading[req.request_id] !== null}
                              title="Reject request"
                            >
                              {actionLoading[req.request_id] === "rejecting" ? (
                                <span>Rejecting...</span>
                              ) : (
                                <>
                                  <X size={14} /> Reject
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* All Users Directory Section */}
      <div className="admin-section">
        <div className="section-header-flex">
          <div className="section-title-area">
            <Users size={20} color="#6366f1" />
            <h2>All User Accounts</h2>
            <span className="count-badge">{filteredUsers.length} shown</span>
          </div>

          {/* Search and Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="role-filter-box">
              <Filter size={15} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="USER">Student (USER)</option>
                <option value="PREMIUM_USER">Premium (PREMIUM_USER)</option>
                <option value="ADMIN">Administrator (ADMIN)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-table-card glass-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User Identity</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Upgrade Status</th>
                  <th>Assign Role</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No user accounts found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const rc = roleColors[u.role] || roleColors.USER;
                    const RoleIcon = rc.icon;
                    const isTarget = String(u.user_id) === String(highlightUserId);

                    return (
                      <tr
                        key={u.user_id}
                        ref={isTarget ? highlightedRowRef : null}
                        className={`user-directory-row ${isTarget ? "highlighted-row" : ""}`}
                      >
                        <td className="idx-cell">{idx + 1}</td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">
                              {u.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <span className="user-name-bold">{u.name}</span>
                              <span className="user-id-sub">#{u.user_id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="email-cell">{u.email}</td>
                        <td>
                          <span
                            className="role-badge-pill"
                            style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
                          >
                            <RoleIcon size={12} /> {rc.label}
                          </span>
                        </td>
                        <td>
                          {u.premium_request ? (
                            u.premium_request.status === "PENDING" ? (
                              <span className="status-tag pending">
                                <Clock size={11} /> Pending Approval
                              </span>
                            ) : u.premium_request.status === "APPROVED" ? (
                              <span className="status-tag approved">
                                <CheckCircle2 size={11} /> Upgrade Approved
                              </span>
                            ) : (
                              <span className="status-tag rejected">
                                <XCircle size={11} /> Request Rejected
                              </span>
                            )
                          ) : (
                            <span className="status-tag none">—</span>
                          )}
                        </td>
                        <td>
                          <div className="role-select-wrapper">
                            <select
                              value={u.role}
                              disabled={actionLoading[`user-${u.user_id}`] || actionLoading[`delete-${u.user_id}`]}
                              onChange={(e) => handleDirectRoleChange(u.user_id, e.target.value, u.name)}
                              className="role-change-select"
                            >
                              <option value="USER">Student (USER)</option>
                              <option value="PREMIUM_USER">Premium Member</option>
                              <option value="ADMIN">Administrator</option>
                            </select>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {u.role !== "ADMIN" && (
                            <button
                              className="btn-delete-user"
                              onClick={() => handleDeleteUser(u.user_id, u.name)}
                              disabled={actionLoading[`delete-${u.user_id}`] || actionLoading[`user-${u.user_id}`]}
                              title={`Delete ${u.name}`}
                            >
                              <Trash2 size={14} />
                              <span>{actionLoading[`delete-${u.user_id}`] ? "Deleting..." : "Delete"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
