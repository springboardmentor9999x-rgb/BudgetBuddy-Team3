import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./notification/NotificationBell";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const navigationItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "🏠",
    },
    {
      path: "/income",
      label: "Income",
      icon: "💰",
    },
    {
      path: "/expense",
      label: "Expense",
      icon: "💳",
    },
    {
      path: "/budget",
      label: "Budget",
      icon: "📊",
    },
    {
      path: "/savings-goals",
      label: "Savings Goals",
      icon: "🎯",
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: "📉",
    },
    {
      path: "/bank-account",
      label: "Bank Account",
      icon: "🏦",
    },
    {
      path: "/profile",
      label: "Profile",
      icon: "👤",
    },
  ];

  /*
   * Admin navigation is added only for the existing Admin account.
   * Normal users and Premium users will continue seeing the
   * existing navigation above.
   */
  const adminNavigationItems = [
    {
      path: "/admin",
      label: "Admin Dashboard",
      icon: "🛡️",
    },
    {
      path: "/admin/users",
      label: "User Management",
      icon: "👥",
    },
    {
      path: "/admin/system-analytics",
      label: "System Analytics",
      icon: "📈",
    },
  ];

  const allNavigationItems =
    user?.role === "admin"
      ? [...navigationItems, ...adminNavigationItems]
      : navigationItems;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const goTo = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="
          fixed
          left-0
          top-0
          h-screen
          w-64
          bg-blue-600
          text-white
          flex
          flex-col
          shadow-lg
          z-50
        "
      >

        {/* LOGO */}

        <div className="px-6 py-5 border-b border-blue-500">

          <h1 className="text-2xl font-bold">
            BudgetBuddy
          </h1>

          <p className="text-blue-100 text-sm mt-1">
            Personal Finance Manager
          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 py-6 overflow-y-auto">

          <div className="space-y-2">

            {allNavigationItems.map((item) => {

              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  className={`
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-lg
                    transition
                    text-left
                    ${
                      active
                        ? "bg-white text-blue-600 font-semibold shadow-sm"
                        : "text-white hover:bg-blue-500"
                    }
                  `}
                >

                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>

                </button>
              );

            })}

          </div>

        </nav>

        {/* =================================================
            UPGRADE TO PREMIUM

            Visible only to Basic Users (role === "user").
            Hidden for Premium users and Admins. Reuses the
            existing PremiumUpgradeModal + requestPremium()
            flow - no new modal or API is created here.
        ================================================= */}

        {user?.role === "user" && (
          <div className="px-4 pb-4">
            <div
              className="
                rounded-xl
                p-4
                bg-blue-500
                bg-opacity-40
                border
                border-blue-400
              "
            >
              <p className="font-semibold flex items-center gap-2">
                <span>⭐</span>
                <span>Upgrade to Premium</span>
              </p>

              <p className="text-blue-100 text-xs mt-2">
                Unlock advanced analytics and premium
                reports.
              </p>

              <button
                onClick={() => setShowUpgradeModal(true)}
                className="
                  w-full
                  mt-3
                  py-2
                  rounded-lg
                  bg-white
                  text-blue-600
                  text-sm
                  font-semibold
                  hover:bg-blue-50
                  transition
                "
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* LOGOUT */}

        <div className="px-4 py-5 border-t border-blue-500">

          <button
            onClick={logout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-lg
              hover:bg-red-500
              transition
              text-left
            "
          >

            <span>
              🚪
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="ml-64 min-h-screen">

        {/* ===================================================
            TOP HEADER
        =================================================== */}

        <header
          className="
            bg-white
            shadow-sm
            px-8
            py-4
            flex
            justify-between
            items-center
            sticky
            top-0
            z-40
          "
        >

          {/* LEFT - ONLY WELCOME MESSAGE */}

          <div>

            <p className="text-xl font-semibold text-gray-800">
              Welcome back, {user?.full_name || user?.email}
            </p>

          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-5">

            <span className="text-gray-600 hidden md:block">
              {user?.email}
            </span>

            {/* NOTIFICATIONS */}

            <NotificationBell />

            {/* LOGOUT */}

            <button
              onClick={logout}
              className="
                bg-red-500
                hover:bg-red-600
                text-white
                px-4
                py-2
                rounded-lg
                transition
              "
            >
              Logout
            </button>

          </div>

        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="p-8">
          {children}
        </main>

      </div>

      {/* =====================================================
          PREMIUM UPGRADE MODAL

          Reuses the existing PremiumUpgradeModal component
          and requestPremium() flow so the sidebar "Upgrade
          Now" button behaves identically to the Analytics
          page upgrade flow.
      ===================================================== */}

      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

    </div>
  );
}