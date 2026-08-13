import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getNotifications,
  markNotificationAsRead,
} from "../api/notifications";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const data = await getNotifications();

      setNotifications(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error("Notification fetch error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );

      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Mark notification error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to mark notification as read"
      );
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Notifications
        </h1>

        <p className="text-gray-600 mt-2">
          You have {unreadCount} unread notification
          {unreadCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-gray-500">
          Loading notifications...
        </div>
      )}

      {/* EMPTY */}
      {!loading && notifications.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-5xl mb-4">
            🔔
          </div>

          <h2 className="text-xl font-semibold">
            No notifications
          </h2>

          <p className="text-gray-500 mt-2">
            You don't have any notifications yet.
          </p>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-4">

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow p-5 border-l-4 ${
                notification.is_read
                  ? "border-gray-300"
                  : "border-blue-600"
              }`}
            >

              <div className="flex justify-between items-start gap-4">

                <div className="flex gap-4">

                  <div className="text-2xl">
                    {notification.type === "budget_alert"
                      ? "⚠️"
                      : notification.type === "goal_milestone"
                      ? "🎯"
                      : notification.type === "monthly_report"
                      ? "📊"
                      : "🔔"}
                  </div>

                  <div>

                    <p
                      className={`text-gray-800 ${
                        !notification.is_read
                          ? "font-semibold"
                          : ""
                      }`}
                    >
                      {notification.message}
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(
                        notification.created_at
                      ).toLocaleString("en-IN")}
                    </p>

                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      {notification.type}
                    </span>

                  </div>

                </div>

                {!notification.is_read && (
                  <button
                    onClick={() =>
                      handleMarkAsRead(notification.id)
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                  >
                    Mark as read
                  </button>
                )}

                {notification.is_read && (
                  <span className="text-sm text-green-600 whitespace-nowrap">
                    ✓ Read
                  </span>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}