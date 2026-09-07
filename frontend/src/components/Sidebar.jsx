import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Landmark,
  FileBarChart,
  Bell,
  User,
  LogOut,
  Sparkles,
  BarChart2,
  ShieldCheck,
  Star,
  Users
} from "lucide-react";
import { useRole } from "../context/RoleContext";
import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { isAdmin, isPremiumOrAdmin, role, clearAuthSession } = useRole();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/income", label: "Income", icon: TrendingUp },
    { to: "/expenses", label: "Expenses", icon: TrendingDown },
    { to: "/budget", label: "Monthly Budget", icon: PiggyBank },
    { to: "/savings-goals", label: "Savings Goals", icon: Target },
    { to: "/accounts", label: "My Accounts", icon: Landmark },
    { to: "/analytics", label: "Analytics", icon: BarChart2 },
    { to: "/reports", label: "Reports & Export", icon: FileBarChart },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/profile", label: "Profile", icon: User },
  ];

  // Role display config
  const roleConfig = {
    ADMIN: { label: "Admin", color: "#f87171", bg: "rgba(239,68,68,0.12)", icon: ShieldCheck },
    PREMIUM_USER: { label: "Premium", color: "#fbbf24", bg: "rgba(245,158,11,0.12)", icon: Star },
    USER: { label: "Student", color: "#a5b4fc", bg: "var(--primary-light)", icon: Sparkles },
  };
  const rc = roleConfig[role] || roleConfig.USER;
  const RoleIcon = rc.icon;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-container">
            <span className="brand-icon">💰</span>
          </div>
          <div className="brand-text">
            <h2>Budget<span>Buddy</span></h2>
            <span className="brand-badge">
              <Sparkles size={11} /> Student Edition
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">MAIN MENU</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={onClose}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Admin-only: User Management & System Analytics */}
          {isAdmin && (
            <>
              <div className="nav-group-title" style={{ marginTop: 12 }}>ADMIN</div>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-link admin-nav-link ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                <Users size={18} className="nav-icon" />
                <span>User Management</span>
              </NavLink>
              <NavLink
                to="/system-analytics"
                className={({ isActive }) => `nav-link admin-nav-link ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                <ShieldCheck size={18} className="nav-icon" />
                <span>System Analytics</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom User / Logout Card */}
        <div className="sidebar-footer">
          {/* Role Badge */}
          <div
            className="sidebar-role-badge"
            style={{ background: rc.bg, border: `1px solid ${rc.color}33` }}
          >
            <RoleIcon size={13} style={{ color: rc.color }} />
            <span style={{ color: rc.color }}>{rc.label}</span>
          </div>

          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
