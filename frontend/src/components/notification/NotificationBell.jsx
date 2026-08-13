import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../../api/notifications";
import { toast } from "react-toastify";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Notification fetch error:", error);

      if (error.response?.status !== 401) {
        toast.error(
          error.response?.data?.detail ||
            "Failed to load notifications"
        );
      }
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const handleMarkAsRead = async (notification) => {
    if (notification.is_read) return;

    setLoading(true);

    try {
      const updatedNotification =
        await markNotificationAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === updatedNotification.id
            ? updatedNotification
            : item
        )
      );
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to mark notification as read"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        title="Notifications"
      >
        <span className="text-2xl">🔔</span>

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -top-1
              -right-1
              bg-red-500
              text-white
              text-xs
              font-bold
              rounded-full
              min-w-[20px]
              h-5
              flex
              items-center
              justify-center
              px-1
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <div
          className="
            absolute
            right-0
            mt-3
            w-96
            bg-white
            rounded-xl
            shadow-xl
            border
            z-50
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">
                Notifications
              </h3>

              <p className="text-sm text-gray-500">
                {unreadCount} unread
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-800 text-xl"
            >
              ×
            </button>
          </div>

          {/* Notifications */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4
                    border-b
                    cursor-pointer
                    transition
                    ${
                      notification.is_read
                        ? "bg-white"
                        : "bg-blue-50"
                    }
                    hover:bg-gray-50
                  `}
                  onClick={() =>
                    handleMarkAsRead(notification)
                  }
                >
                  <div className="flex gap-3">
                    <div className="text-xl">
                      {notification.type ===
                      "budget_alert"
                        ? "⚠️"
                        : notification.type ===
                          "goal_milestone"
                        ? "🎯"
                        : notification.type ===
                          "monthly_report"
                        ? "📊"
                        : "🔔"}
                    </div>

                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          notification.is_read
                            ? "text-gray-600"
                            : "text-gray-900 font-semibold"
                        }`}
                      >
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(
                          notification.created_at
                        )}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t text-center">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh notifications"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}