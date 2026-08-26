import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Inbox
} from "lucide-react";
import API, { onDataChanged, notifyDataChanged } from "../services/api";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/notifications/");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unread_count || 0);
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = onDataChanged(() => {
      fetchNotifications();
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      notifyDataChanged({ type: "notification_read" });
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setSuccess("All notifications marked as read!");
      notifyDataChanged({ type: "notifications_read_all" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Mark all read error:", err);
      setError("Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== id)
      );
      notifyDataChanged({ type: "notification_deleted" });
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) {
      return;
    }

    try {
      await API.delete("/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
      setSuccess("All notifications cleared!");
      notifyDataChanged({ type: "notifications_cleared" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Clear all notifications error:", err);
      setError("Failed to clear notifications");
    }
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <div className="notifications-page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header-banner notif-theme glass-card">
        <div>
          <h1>Notification Center 🔔</h1>
          <p>Stay informed on your spending limits, deposit milestones, and budget health</p>
        </div>
        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary">
              <CheckCheck size={16} /> Mark All Read ({unreadCount})
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} className="btn-danger">
              <Trash2 size={16} /> Clear All
            </button>
          )}
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

      {/* Filter Tabs */}
      <div className="notif-tabs-bar">
        <button
          className={`notif-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          className={`notif-tab ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="notif-list-container glass-card">
        {loading && notifications.length === 0 ? (
          <div className="table-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="table-empty">
            <span className="empty-emoji">✨</span>
            <h4>No notifications</h4>
            <p>
              {filter === "unread"
                ? "You have caught up with all your alerts!"
                : "No notifications found in your inbox."}
            </p>
          </div>
        ) : (
          <div className="notif-items-wrapper">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.notification_id}
                className={`notif-card-item ${
                  notif.is_read ? "read" : "unread"
                }`}
                onClick={() =>
                  !notif.is_read && handleMarkAsRead(notif.notification_id)
                }
              >
                <div className="notif-left-col">
                  <div className="notif-status-dot" />
                  <div className="notif-body">
                    <div className="notif-title-row">
                      <h4>{notif.title}</h4>
                      <span className="notif-timestamp">
                        {new Date(notif.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="notif-message-text">{notif.message}</p>
                  </div>
                </div>

                <div className="notif-actions-col">
                  {!notif.is_read && (
                    <button
                      className="btn-mark-read"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.notification_id);
                      }}
                      title="Mark as read"
                    >
                      <CheckCheck size={14} /> Read
                    </button>
                  )}
                  <button
                    className="btn-icon delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notif.notification_id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;