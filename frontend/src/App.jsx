import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ==========================================================
// PUBLIC PAGES
// ==========================================================

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

// ==========================================================
// PROTECTED PAGES
// ==========================================================

import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Budget from "./pages/Budget";
import BankAccount from "./pages/BankAccount";
import Profile from "./pages/Profile";
import SavingsGoals from "./pages/SavingsGoals";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

// ==========================================================
// ROUTE / LAYOUT
// ==========================================================

import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            DEFAULT ROUTE
        ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* SIGNUP */}

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* FORGOT PASSWORD */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* RESET PASSWORD */}

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* ==================================================
            VERIFY EMAIL
        ================================================== */}

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        {/* ==================================================
            PROTECTED ROUTES
        ================================================== */}

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* INCOME */}

        <Route
          path="/income"
          element={
            <ProtectedRoute>
              <Layout>
                <Income />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* EXPENSE */}

        <Route
          path="/expense"
          element={
            <ProtectedRoute>
              <Layout>
                <Expense />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* BUDGET */}

        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <Layout>
                <Budget />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* SAVINGS GOALS */}

        <Route
          path="/savings-goals"
          element={
            <ProtectedRoute>
              <Layout>
                <SavingsGoals />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ANALYTICS */}

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* BANK ACCOUNT */}

        <Route
          path="/bank-account"
          element={
            <ProtectedRoute>
              <Layout>
                <BankAccount />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            UNKNOWN ROUTE
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

      {/* ====================================================
          TOAST NOTIFICATIONS
      ==================================================== */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />

    </BrowserRouter>
  );
}