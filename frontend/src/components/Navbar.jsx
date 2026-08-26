import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Menu,
  User,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  X
} from "lucide-react";
import API, { onDataChanged } from "../services/api";
import "./Navbar.css";

function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch notifications and unread count
  const loadNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await API.get("/notifications/");
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error("Navbar notifications load error:", err);
    }
  };

  // Fetch user profile info
  const loadUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await API.get("/users/profile");
      setUserProfile(res.data);
    } catch (err) {
      // Fallback
      setUserProfile({ name: "Student User", email: "" });
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUserProfile();

    // Subscribe to cross-component data changes (CRITICAL for live state without page refresh)
    const unsubscribe = onDataChanged(() => {
      loadNotifications();
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single as read
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  return (
    <header className="app-header">
      {/* Left: Mobile Menu Trigger & Welcome Greeting */}
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-greeting">
          <span className="greeting-pill">🎓 Student Finance Hub</span>
        </div>
      </div>

      {/* Right: Quick Actions & Notification Bell & Profile */}
      <div className="header-right">
        {/* Quick Add Buttons */}
        <div className="quick-actions">
          <Link to="/expenses" className="quick-btn expense-btn" title="Add Expense">
            <TrendingDown size={15} />
            <span>- Expense</span>
          </Link>
          <Link to="/income" className="quick-btn income-btn" title="Add Income">
            <TrendingUp size={15} />
            <span>+ Income</span>
          </Link>
        </div>

        {/* Notification Bell Dropdown Container */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            className={`notification-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showDropdown && (
            <div className="notifications-dropdown-menu animate-fade-in">
              <div className="dropdown-header">
                <div className="dropdown-title">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="unread-count-pill">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    className="mark-all-btn"
                    onClick={handleMarkAllRead}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="dropdown-list">
                {notifications.length === 0 ? (
                  <div className="dropdown-empty">
                    <span className="empty-bell">🔔</span>
                    <p>No notifications yet</p>
                    <small>Alerts and updates will appear here</small>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notif) => (
                    <div
                      key={notif.notification_id}
                      className={`dropdown-item ${notif.is_read ? "read" : "unread"}`}
                      onClick={(e) => !notif.is_read && handleMarkAsRead(notif.notification_id, e)}
                    >
                      <div className="item-indicator" />
                      <div className="item-content">
                        <div className="item-top">
                          <h4 className="item-title">{notif.title}</h4>
                          <span className="item-time">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="item-msg">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="dropdown-footer">
                <Link
                  to="/notifications"
                  className="view-all-link"
                  onClick={() => setShowDropdown(false)}
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <Link to="/profile" className="header-profile-pill">
          <div className="profile-avatar">
            <User size={16} />
          </div>
          <div className="profile-info-text">
            <span className="user-name">{userProfile?.name || "Student User"}</span>
            <span className="user-role">Student</span>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;