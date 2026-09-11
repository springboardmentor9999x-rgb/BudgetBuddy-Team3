import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
} from "../api/notifications";

export default function Navbar() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  // ==========================================================
  // NOTIFICATION STATE
  // ==========================================================

  const [notifications, setNotifications] = useState([]);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const notificationRef = useRef(null);

  // ----------------------------------------------------------
  // IMPORTANT
  //
  // Stores the ID of the user for whom the latest notification
  // request was made.
  //
  // This prevents an old user's API response from being placed
  // into the new user's notification state.
  // ----------------------------------------------------------

  const notificationUserIdRef = useRef(null);

  // ----------------------------------------------------------
  // Keeps the latest AbortController.
  //
  // When the user changes, the previous request is cancelled.
  // ----------------------------------------------------------

  const notificationAbortControllerRef = useRef(null);


  // ==========================================================
  // FETCH NOTIFICATIONS
  // ==========================================================

  const fetchNotifications = async () => {
    // --------------------------------------------------------
    // Do not request notifications if user is not logged in
    // --------------------------------------------------------

    if (!user) {
      setNotifications([]);
      notificationUserIdRef.current = null;

      if (
        notificationAbortControllerRef.current
      ) {
        notificationAbortControllerRef.current.abort();

        notificationAbortControllerRef.current = null;
      }

      return;
    }

    const currentUserId = user.id;

    // --------------------------------------------------------
    // Cancel any previous notification request.
    // --------------------------------------------------------

    if (
      notificationAbortControllerRef.current
    ) {
      notificationAbortControllerRef.current.abort();
    }

    const controller =
      new AbortController();

    notificationAbortControllerRef.current =
      controller;

    // Remember which user this request belongs to.
    notificationUserIdRef.current =
      currentUserId;

    try {
      setNotificationLoading(true);

      const data = await getNotifications(
        controller.signal
      );

      // ------------------------------------------------------
      // IMPORTANT SECURITY / STATE CHECK
      //
      // Only update notifications if the response still
      // belongs to the currently logged-in user.
      // ------------------------------------------------------

      if (
        notificationUserIdRef.current !==
        currentUserId
      ) {
        return;
      }

      // Also verify that the current user has not changed.
      if (!user || user.id !== currentUserId) {
        return;
      }

      setNotifications(
        Array.isArray(data) ? data : []
      );

    } catch (error) {

      // ------------------------------------------------------
      // AbortError is expected when switching users or when
      // another request replaces the previous request.
      // Do not show it as a real error.
      // ------------------------------------------------------

      if (
        error?.name === "CanceledError" ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
        return;
      }

      console.error(
        "Navbar notification fetch error:",
        error
      );

    } finally {

      // Only clear loading state if this request still
      // belongs to the current user.

      if (
        notificationUserIdRef.current ===
        currentUserId
      ) {
        setNotificationLoading(false);
      }

    }
  };


  // ==========================================================
  // INITIAL FETCH + AUTOMATIC REFRESH
  // ==========================================================

  useEffect(() => {

    // --------------------------------------------------------
    // IMPORTANT:
    //
    // Clear old user's notifications immediately whenever
    // the authenticated user changes.
    // --------------------------------------------------------

    setNotifications([]);

    setNotificationOpen(false);

    notificationUserIdRef.current =
      user?.id ?? null;

    // Cancel any request belonging to the previous user.
    if (
      notificationAbortControllerRef.current
    ) {
      notificationAbortControllerRef.current.abort();

      notificationAbortControllerRef.current =
        null;
    }

    // --------------------------------------------------------
    // If nobody is logged in, stop here.
    // --------------------------------------------------------

    if (!user) {
      setNotificationLoading(false);
      return;
    }

    // --------------------------------------------------------
    // Fetch immediately after login / user change.
    // --------------------------------------------------------

    fetchNotifications();

    // --------------------------------------------------------
    // Automatically check every 5 seconds.
    // --------------------------------------------------------

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    // --------------------------------------------------------
    // Refresh when user returns to the tab/window.
    // --------------------------------------------------------

    const handleFocus = () => {
      fetchNotifications();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    // --------------------------------------------------------
    // Cleanup.
    // --------------------------------------------------------

    return () => {

      clearInterval(interval);

      window.removeEventListener(
        "focus",
        handleFocus
      );

      // Cancel request when user changes or Navbar unmounts.
      if (
        notificationAbortControllerRef.current
      ) {
        notificationAbortControllerRef.current.abort();

        notificationAbortControllerRef.current =
          null;
      }
    };

  }, [user?.id]);


  // ==========================================================
  // REFRESH WHEN PAGE BECOMES VISIBLE
  // ==========================================================

  useEffect(() => {

    if (!user) {
      return;
    }

    const currentUserId = user.id;

    const handleVisibilityChange = () => {

      if (
        document.visibilityState === "visible"
      ) {

        // ----------------------------------------------------
        // Do not fetch if the authenticated user changed.
        // ----------------------------------------------------

        if (
          notificationUserIdRef.current !==
          currentUserId
        ) {
          return;
        }

        fetchNotifications();
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

  }, [user?.id]);


  // ==========================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ==========================================================

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationOpen(false);
      }

    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);


  // ==========================================================
  // MARK NOTIFICATION AS READ
  // ==========================================================

  const handleMarkAsRead = async (
    notificationId
  ) => {

    try {

      await markNotificationAsRead(
        notificationId
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );

    } catch (error) {

      console.error(
        "Failed to mark notification as read:",
        error
      );

    }

  };


  // ==========================================================
  // OPEN NOTIFICATIONS PAGE
  // ==========================================================

  const openNotificationsPage = () => {

    setNotificationOpen(false);

    navigate("/notifications");

  };


  // ==========================================================
  // UNREAD COUNT
  // ==========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;


  // ==========================================================
  // FORMAT NOTIFICATION TIME
  // ==========================================================

  const formatNotificationTime = (
    createdAt
  ) => {

    if (!createdAt) {
      return "Unknown time";
    }

    try {

      let dateString = String(
        createdAt
      );

      // ------------------------------------------------------
      // If backend sends a UTC datetime without timezone:
      //
      // 2026-08-24T03:56:00
      //
      // Add Z so JavaScript interprets it as UTC.
      // ------------------------------------------------------

      if (
        !dateString.endsWith("Z") &&
        !/[+-]\d{2}:\d{2}$/.test(
          dateString
        )
      ) {
        dateString += "Z";
      }

      const date =
        new Date(dateString);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "Unknown time";
      }

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

      return "Unknown time";
    }

  };


  // ==========================================================
  // NOTIFICATION ICON
  // ==========================================================

  const getNotificationIcon = (
    type
  ) => {

    if (
      type === "budget_alert"
    ) {
      return "⚠️";
    }

    if (
      type === "goal_milestone"
    ) {
      return "🎯";
    }

    if (
      type === "goal_completed"
    ) {
      return "🏆";
    }

    if (
      type === "monthly_report"
    ) {
      return "📊";
    }

    if (
      type === "premium_request"
    ) {
      return "⭐";
    }

    return "🔔";
  };


  // ==========================================================
  // NAVIGATION CLASS
  // ==========================================================

  const linkClass = ({
    isActive,
  }) =>
    `block px-4 py-3 rounded-lg font-medium transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
    }`;


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    // --------------------------------------------------------
    // Cancel notification request immediately.
    // --------------------------------------------------------

    if (
      notificationAbortControllerRef.current
    ) {
      notificationAbortControllerRef.current.abort();

      notificationAbortControllerRef.current =
        null;
    }

    notificationUserIdRef.current = null;

    // --------------------------------------------------------
    // Clear notification state.
    // --------------------------------------------------------

    setNotifications([]);

    setNotificationOpen(false);

    setNotificationLoading(false);

    // --------------------------------------------------------
    // Existing logout.
    // --------------------------------------------------------

    logout();

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r shadow-sm flex flex-col">

      {/* ====================================================
          LOGO
      ==================================================== */}

      <div className="px-6 py-6 border-b">

        <h1 className="text-2xl font-bold text-blue-700">
          BudgetBuddy
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Personal Finance
        </p>

      </div>


      {/* ====================================================
          USER
      ==================================================== */}

      <div className="px-6 py-5 border-b">

        <p className="text-sm text-gray-500">
          Welcome
        </p>

        <p className="font-semibold text-gray-800 truncate">
          {user?.email || "User"}
        </p>

      </div>


      {/* ====================================================
          NAVIGATION
      ==================================================== */}

      <nav className="flex-1 px-4 py-6 space-y-2">

        <NavLink
          to="/dashboard"
          className={linkClass}
        >
          🏠 Dashboard
        </NavLink>


        <NavLink
          to="/income"
          className={linkClass}
        >
          💰 Income
        </NavLink>


        <NavLink
          to="/expense"
          className={linkClass}
        >
          💸 Expenses
        </NavLink>


        <NavLink
          to="/budget"
          className={linkClass}
        >
          📊 Budget
        </NavLink>


        {/* ==================================================
            SAVINGS GOALS
        ================================================== */}

        <NavLink
          to="/goals"
          className={linkClass}
        >
          🎯 Savings Goals
        </NavLink>


        {/* ==================================================
            NOTIFICATIONS PAGE
        ================================================== */}

        <NavLink
          to="/notifications"
          className={linkClass}
        >
          🔔 Notifications

          {unreadCount > 0 && (

            <span
              className="
                ml-2
                inline-flex
                items-center
                justify-center
                min-w-[22px]
                h-[22px]
                px-1.5
                rounded-full
                bg-red-500
                text-white
                text-xs
                font-bold
              "
            >
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>

          )}

        </NavLink>


        {/* ==================================================
            BANK ACCOUNT
        ================================================== */}

        <NavLink
          to="/bank-accounts"
          className={linkClass}
        >
          🏦 Bank Accounts
        </NavLink>

      </nav>


      {/* ====================================================
          BOTTOM SECTION
      ==================================================== */}

      <div className="p-4 border-t space-y-3">


        {/* ==================================================
            NOTIFICATION BELL
        ================================================== */}

        <div
          className="relative"
          ref={notificationRef}
        >

          <button
            type="button"
            onClick={() =>
              setNotificationOpen(
                (previous) =>
                  !previous
              )
            }
            className="
              w-full
              flex
              items-center
              justify-between
              px-4
              py-3
              rounded-lg
              border
              border-gray-200
              bg-white
              hover:bg-gray-50
              transition
            "
          >

            <div className="flex items-center gap-3">

              <span className="text-xl">
                🔔
              </span>

              <span className="font-medium text-gray-700">
                Notifications
              </span>

            </div>


            {/* UNREAD BADGE */}

            {unreadCount > 0 && (

              <span
                className="
                  min-w-[24px]
                  h-[24px]
                  px-1.5
                  rounded-full
                  bg-red-500
                  text-white
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                "
              >
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>

            )}

          </button>


          {/* ==================================================
              NOTIFICATION DROPDOWN
          ================================================== */}

          {notificationOpen && (

            <div
              className="
                absolute
                left-0
                bottom-full
                mb-2
                w-[360px]
                max-w-[calc(100vw-2rem)]
                bg-white
                border
                border-gray-200
                rounded-xl
                shadow-xl
                overflow-hidden
                z-50
              "
            >

              {/* DROPDOWN HEADER */}

              <div
                className="
                  px-4
                  py-3
                  border-b
                  bg-gray-50
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h3 className="font-semibold text-gray-800">
                    Notifications
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {unreadCount} unread
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    openNotificationsPage
                  }
                  className="
                    text-sm
                    text-blue-600
                    hover:text-blue-800
                    font-medium
                  "
                >
                  View all
                </button>

              </div>


              {/* LOADING */}

              {notificationLoading &&
                notifications.length === 0 && (

                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    Loading notifications...
                  </div>

                )}


              {/* EMPTY */}

              {!notificationLoading &&
                notifications.length === 0 && (

                  <div className="px-4 py-8 text-center">

                    <div className="text-3xl mb-2">
                      🔔
                    </div>

                    <p className="text-sm font-medium text-gray-700">
                      No notifications
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      You're all caught up.
                    </p>

                  </div>

                )}


              {/* NOTIFICATION LIST */}

              {notifications.length > 0 && (

                <div className="max-h-[420px] overflow-y-auto">

                  {notifications
                    .slice(0, 10)
                    .map(
                      (
                        notification
                      ) => (

                        <div
                          key={
                            notification.id
                          }
                          className={`
                            px-4
                            py-3
                            border-b
                            border-gray-100
                            hover:bg-gray-50
                            transition
                            ${
                              notification.is_read
                                ? "bg-white"
                                : "bg-blue-50"
                            }
                          `}
                        >

                          <div className="flex gap-3">

                            {/* ICON */}

                            <div className="text-xl flex-shrink-0">

                              {getNotificationIcon(
                                notification.type
                              )}

                            </div>


                            {/* CONTENT */}

                            <div className="flex-1 min-w-0">

                              <p
                                className={`
                                  text-sm
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


                              <p className="text-xs text-gray-500 mt-1">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </p>


                              {/* MARK AS READ */}

                              {!notification.is_read && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMarkAsRead(
                                      notification.id
                                    )
                                  }
                                  className="
                                    text-xs
                                    text-blue-600
                                    hover:text-blue-800
                                    font-medium
                                    mt-2
                                  "
                                >
                                  Mark as read
                                </button>

                              )}

                            </div>

                          </div>

                        </div>

                      )
                    )}

                </div>

              )}


              {/* FOOTER */}

              {notifications.length > 0 && (

                <button
                  type="button"
                  onClick={
                    openNotificationsPage
                  }
                  className="
                    w-full
                    px-4
                    py-3
                    text-sm
                    text-blue-600
                    hover:bg-blue-50
                    font-medium
                    transition
                  "
                >
                  View all notifications →
                </button>

              )}

            </div>

          )}

        </div>


        {/* ==================================================
            LOGOUT
        ================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            w-full
            bg-red-500
            hover:bg-red-600
            text-white
            py-3
            rounded-lg
            font-medium
            transition
          "
        >
          🚪 Logout
        </button>

      </div>

    </aside>

  );
}