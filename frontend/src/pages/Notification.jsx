import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { toast } from "react-toastify";

import {
  getNotifications,
  markNotificationAsRead,
} from "../api/notifications";


// ==========================================================
// CONVERT BACKEND UTC TIME TO IST
// ==========================================================

const formatNotificationDate = (createdAt) => {

  if (!createdAt) {
    return "Not available";
  }

  try {

    let utcDateString = String(createdAt);

    // ------------------------------------------------------
    // BACKEND UTC TIMESTAMP
    //
    // If backend returns:
    //
    // 2026-08-24T03:56:00
    //
    // PostgreSQL/SQLAlchemy may return it without "Z".
    //
    // Add Z so JavaScript treats it as UTC.
    // ------------------------------------------------------

    if (
      !utcDateString.endsWith("Z") &&
      !/[+-]\d{2}:\d{2}$/.test(
        utcDateString
      )
    ) {
      utcDateString =
        `${utcDateString}Z`;
    }

    const date =
      new Date(utcDateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not available";
    }

    // ------------------------------------------------------
    // CONVERT UTC → INDIA STANDARD TIME
    // ------------------------------------------------------

    return date.toLocaleString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",

        day: "2-digit",
        month: "short",
        year: "numeric",

        hour: "2-digit",
        minute: "2-digit",

        hour12: true,
      }
    );

  } catch (error) {

    console.error(
      "Notification date formatting error:",
      error
    );

    return "Not available";
  }
};


// ==========================================================
// GET NOTIFICATION ICON
// ==========================================================

const getNotificationIcon = (type) => {

  switch (type) {

    case "budget_alert":
      return "⚠️";

    case "goal_milestone":
      return "🎯";

    case "goal_completed":
      return "🎉";

    case "monthly_report":
      return "📊";

    default:
      return "🔔";
  }
};


// ==========================================================
// NOTIFICATIONS PAGE
// ==========================================================

export default function Notifications() {

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  // ========================================================
  // FETCH NOTIFICATIONS
  // ========================================================

  const fetchNotifications = useCallback(
    async (showLoading = false) => {

      try {

        if (showLoading) {
          setLoading(true);
        }

        const data =
          await getNotifications();

        setNotifications(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Notification fetch error:",
          error
        );

        // Don't show an error toast during
        // background polling.

        if (showLoading) {

          toast.error(
            error.response?.data?.detail ||
            "Failed to load notifications"
          );
        }

      } finally {

        if (showLoading) {
          setLoading(false);
        }

      }
    },
    []
  );


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    fetchNotifications(true);

  }, [
    fetchNotifications,
  ]);


  // ========================================================
  // AUTOMATIC REFRESH
  //
  // Checks every 5 seconds.
  // ========================================================

  useEffect(() => {

    const intervalId =
      setInterval(() => {

        fetchNotifications(false);

      }, 5000);


    return () => {

      clearInterval(
        intervalId
      );

    };

  }, [
    fetchNotifications,
  ]);


  // ========================================================
  // REFRESH WHEN TAB BECOMES ACTIVE
  //
  // Example:
  //
  // User goes to Expenses
  // Adds expense
  // Comes back to Notifications
  //
  // The page immediately checks again.
  // ========================================================

  useEffect(() => {

    const handleVisibilityChange = () => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        fetchNotifications(false);

      }

    };


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

    };

  }, [
    fetchNotifications,
  ]);


  // ========================================================
  // REFRESH WHEN WINDOW GETS FOCUS
  // ========================================================

  useEffect(() => {

    const handleFocus = () => {

      fetchNotifications(false);

    };


    window.addEventListener(
      "focus",
      handleFocus
    );


    return () => {

      window.removeEventListener(
        "focus",
        handleFocus
      );

    };

  }, [
    fetchNotifications,
  ]);


  // ========================================================
  // MARK NOTIFICATION AS READ
  // ========================================================

  const handleMarkAsRead = async (id) => {

    try {

      await markNotificationAsRead(id);

      setNotifications(
        (previous) =>
          previous.map(
            (notification) =>
              notification.id === id
                ? {
                    ...notification,
                    is_read: true,
                  }
                : notification
          )
      );

      toast.success(
        "Notification marked as read"
      );

    } catch (error) {

      console.error(
        "Mark notification error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to mark notification as read"
      );
    }
  };


  // ========================================================
  // UNREAD COUNT
  // ========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;


  // ========================================================
  // RENDER
  // ========================================================

  return (

    <div className="min-h-screen bg-gray-100 p-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Notifications
        </h1>

        <p className="text-gray-600 mt-2">

          You have {unreadCount} unread notification
          {unreadCount !== 1
            ? "s"
            : ""}

        </p>

      </div>


      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading && (

        <div className="text-center py-10 text-gray-500">

          Loading notifications...

        </div>

      )}


      {/* ====================================================
          EMPTY
      ==================================================== */}

      {!loading &&
        notifications.length === 0 && (

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


      {/* ====================================================
          NOTIFICATIONS
      ==================================================== */}

      {!loading &&
        notifications.length > 0 && (

          <div className="space-y-4">

            {notifications.map(
              (notification) => (

                <div
                  key={
                    notification.id
                  }
                  className={`
                    bg-white
                    rounded-xl
                    shadow
                    p-5
                    border-l-4
                    ${
                      notification.is_read
                        ? "border-gray-300"
                        : "border-blue-600"
                    }
                  `}
                >

                  <div className="flex justify-between items-start gap-4">

                    {/* ==================================================
                        NOTIFICATION CONTENT
                    ================================================== */}

                    <div className="flex gap-4">

                      {/* ICON */}

                      <div className="text-2xl">

                        {getNotificationIcon(
                          notification.type
                        )}

                      </div>


                      {/* MESSAGE + TIME */}

                      <div>

                        <p
                          className={`
                            text-gray-800
                            ${
                              !notification.is_read
                                ? "font-semibold"
                                : ""
                            }
                          `}
                        >

                          {
                            notification.message
                          }

                        </p>


                        {/* ==================================================
                            CREATED TIME
                            UTC → IST
                        ================================================== */}

                        <p className="text-sm text-gray-500 mt-2">

                          {formatNotificationDate(
                            notification.created_at
                          )}

                        </p>


                        {/* ==================================================
                            TYPE
                        ================================================== */}

                        <span
                          className="
                            inline-block
                            mt-2
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            bg-gray-100
                            text-gray-600
                          "
                        >

                          {
                            notification.type
                          }

                        </span>

                      </div>

                    </div>


                    {/* ==================================================
                        MARK AS READ
                    ================================================== */}

                    {!notification.is_read && (

                      <button
                        type="button"
                        onClick={() =>
                          handleMarkAsRead(
                            notification.id
                          )
                        }
                        className="
                          bg-blue-600
                          hover:bg-blue-700
                          text-white
                          px-3
                          py-2
                          rounded-lg
                          text-sm
                          whitespace-nowrap
                        "
                      >

                        Mark as read

                      </button>

                    )}


                    {/* ==================================================
                        ALREADY READ
                    ================================================== */}

                    {notification.is_read && (

                      <span
                        className="
                          text-sm
                          text-green-600
                          whitespace-nowrap
                        "
                      >

                        ✓ Read

                      </span>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

    </div>

  );
}