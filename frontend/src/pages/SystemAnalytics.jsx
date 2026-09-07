import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  BarChart2,
  Shield,
  Star,
  UserCheck,
  RefreshCw,
  Lock,
} from "lucide-react";
import API from "../services/api";
import { useRole } from "../context/RoleContext";
import "./SystemAnalytics.css";

function fmt(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

function StatCard({ icon: Icon, label, value, color, bg, border, subtext }) {
  return (
    <div className="sys-stat-card" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="sys-stat-icon" style={{ color, background: bg, border: `1px solid ${border}` }}>
        <Icon size={20} />
      </div>
      <div className="sys-stat-body">
        <p className="sys-stat-label">{label}</p>
        <h3 className="sys-stat-value" style={{ color }}>{value}</h3>
        {subtext && <p className="sys-stat-sub">{subtext}</p>}
      </div>
    </div>
  );
}

export default function SystemAnalytics() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useRole();

  const [analytics, setAnalytics] = useState(null);
  const [catSummary, setCatSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sysRes, catRes, usersRes] = await Promise.all([
        API.get("/admin/system-analytics"),
        API.get("/admin/category-summary"),
        API.get("/admin/users"),
      ]);
      setAnalytics(sysRes.data);
      setCatSummary(catRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError("Failed to load system analytics. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) {
      navigate("/analytics");
      return;
    }
    load();
  }, [isAdmin, roleLoading]);

  if (roleLoading || (loading && !analytics)) {
    return (
      <div className="sys-analytics-page animate-fade-in">
        <div className="sys-header">
          <div className="sys-role-badge">
            <Shield size={14} /> Admin System Dashboard
          </div>
          <h1>System Analytics</h1>
        </div>
        <div className="sys-stats-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="analytics-skeleton" style={{ height: 100, borderRadius: 14 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sys-analytics-page animate-fade-in">
        <div className="alert-error">
          <Lock size={16} /> {error}
        </div>
      </div>
    );
  }

  const roleColors = {
    ADMIN: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
    PREMIUM_USER: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    USER: { bg: "var(--primary-light)", color: "#a5b4fc", border: "rgba(99,102,241,0.25)" },
  };

  return (
    <div className="sys-analytics-page animate-fade-in">
      {/* HEADER */}
      <div className="sys-header">
        <div className="sys-header-left">
          <div className="sys-role-badge">
            <Shield size={14} /> Admin System Dashboard
          </div>
          <h1>System Analytics</h1>
          <p>Platform-wide aggregated metrics — no individual user data exposed</p>
        </div>
        <div className="sys-header-right">
          <button className="analytics-refresh-btn" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <section className="sys-section">
        <h2 className="sys-section-title">
          <Users size={16} /> Platform Overview
        </h2>
        <div className="sys-stats-grid">
          <StatCard
            icon={Users}
            label="Total Users"
            value={analytics.total_users.toLocaleString()}
            color="#6366f1"
            bg="var(--primary-light)"
            border="rgba(99,102,241,0.25)"
          />
          <StatCard
            icon={UserCheck}
            label="Active Users"
            value={analytics.total_active_users.toLocaleString()}
            color="#10b981"
            bg="var(--success-light)"
            border="rgba(16,185,129,0.25)"
            subtext="with income or expense records"
          />
          <StatCard
            icon={Star}
            label="Premium Users"
            value={analytics.total_premium_users.toLocaleString()}
            color="#f59e0b"
            bg="rgba(245,158,11,0.12)"
            border="rgba(245,158,11,0.25)"
          />
          <StatCard
            icon={Shield}
            label="Admin Users"
            value={analytics.total_admin_users.toLocaleString()}
            color="#ef4444"
            bg="var(--danger-light)"
            border="rgba(239,68,68,0.25)"
          />
          <StatCard
            icon={TrendingUp}
            label="Income Records"
            value={analytics.total_income_records.toLocaleString()}
            color="#10b981"
            bg="var(--success-light)"
            border="rgba(16,185,129,0.25)"
          />
          <StatCard
            icon={TrendingDown}
            label="Expense Records"
            value={analytics.total_expense_records.toLocaleString()}
            color="#ef4444"
            bg="var(--danger-light)"
            border="rgba(239,68,68,0.25)"
          />
          <StatCard
            icon={PiggyBank}
            label="Total Budgets"
            value={analytics.total_budgets.toLocaleString()}
            color="#8b5cf6"
            bg="var(--accent-light)"
            border="rgba(139,92,246,0.25)"
          />
          <StatCard
            icon={Target}
            label="Financial Goals"
            value={analytics.total_goals.toLocaleString()}
            color="#3b82f6"
            bg="var(--info-light)"
            border="rgba(59,130,246,0.25)"
          />
        </div>
      </section>

      {/* TRANSACTION VOLUME */}
      <section className="sys-section">
        <h2 className="sys-section-title">
          <BarChart2 size={16} /> Platform Transaction Volume
        </h2>
        <div className="sys-volume-grid">
          <div className="sys-volume-card glass-card">
            <p className="sys-volume-label">Total Income Volume</p>
            <h2 className="sys-volume-amount" style={{ color: "var(--success)" }}>
              {fmt(analytics.total_income_volume)}
            </h2>
            <div className="sys-volume-bar">
              <div
                className="sys-volume-bar-fill income-fill"
                style={{
                  width: `${Math.min(
                    (analytics.total_income_volume /
                      Math.max(analytics.total_income_volume, analytics.total_expense_volume)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="sys-volume-card glass-card">
            <p className="sys-volume-label">Total Expense Volume</p>
            <h2 className="sys-volume-amount" style={{ color: "var(--danger)" }}>
              {fmt(analytics.total_expense_volume)}
            </h2>
            <div className="sys-volume-bar">
              <div
                className="sys-volume-bar-fill expense-fill"
                style={{
                  width: `${Math.min(
                    (analytics.total_expense_volume /
                      Math.max(analytics.total_income_volume, analytics.total_expense_volume)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="sys-volume-card glass-card">
            <p className="sys-volume-label">Platform Net Savings</p>
            <h2
              className="sys-volume-amount"
              style={{
                color: analytics.platform_net_savings >= 0 ? "var(--primary)" : "var(--danger)",
              }}
            >
              {fmt(analytics.platform_net_savings)}
            </h2>
            <p className="sys-volume-sub">
              {analytics.platform_net_savings >= 0
                ? "Users collectively saving money"
                : "Platform expenses exceed income"}
            </p>
          </div>
        </div>
      </section>

      {/* TOP CATEGORIES */}
      {catSummary && catSummary.categories?.length > 0 && (
        <section className="sys-section">
          <h2 className="sys-section-title">
            <BarChart2 size={16} /> Platform-wide Top Spending Categories
          </h2>
          <div className="sys-categories-card glass-card">
            <div className="sys-cat-header">
              <span>Category</span>
              <span>Total Volume</span>
              <span>Transactions</span>
              <span>% of Platform</span>
            </div>
            {catSummary.categories.slice(0, 10).map((cat, i) => (
              <div key={i} className="sys-cat-row">
                <div className="sys-cat-name">
                  <span
                    className="sys-cat-rank"
                    style={{ background: i < 3 ? "var(--primary-light)" : "var(--bg-surface)" }}
                  >
                    #{i + 1}
                  </span>
                  {cat.category}
                </div>
                <span className="sys-cat-amount">{fmt(cat.total_amount)}</span>
                <span className="sys-cat-count">{cat.transaction_count.toLocaleString()}</span>
                <div className="sys-cat-pct-col">
                  <div className="sys-cat-bar-track">
                    <div
                      className="sys-cat-bar-fill"
                      style={{ width: `${cat.platform_percentage}%` }}
                    />
                  </div>
                  <span className="sys-cat-pct-label">{cat.platform_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* USERS TABLE */}
      {users.length > 0 && (
        <section className="sys-section">
          <h2 className="sys-section-title">
            <Users size={16} /> All Users
            <span className="sys-count-badge">{users.length} total</span>
          </h2>
          <div className="sys-users-card glass-card">
            <div className="sys-users-header">
              <span>#</span>
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
            </div>
            {users.map((u, i) => {
              const rc = roleColors[u.role] || roleColors.USER;
              return (
                <div key={u.user_id} className="sys-user-row">
                  <span className="sys-user-idx">{i + 1}</span>
                  <span className="sys-user-name">{u.name}</span>
                  <span className="sys-user-email">{u.email}</span>
                  <span
                    className="sys-user-role"
                    style={{ color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}
                  >
                    {u.role === "ADMIN" && <Shield size={11} />}
                    {u.role === "PREMIUM_USER" && <Star size={11} />}
                    {u.role}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
