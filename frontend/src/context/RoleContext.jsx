import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import API from "../services/api";

// ==========================================
// ROLE CONTEXT — Provides role-based state
// to all components in the app tree.
//
// Source of truth priority:
//   1. /users/profile API (always fetched on mount)
//   2. localStorage "userRole" (used as fast initial hint only)
// ==========================================

const RoleContext = createContext({
  role: "USER",
  isUser: true,
  isPremium: false,
  isAdmin: false,
  isPremiumOrAdmin: false,
  userName: "",
  userEmail: "",
  loading: true,
  refreshRole: () => {}
});

export function RoleProvider({ children }) {
  // Use localStorage as a fast initial hint to avoid a "USER" flash,
  // but always overwrite with the authoritative API value.
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || "USER");
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");
  const [userEmail, setUserEmail] = useState("");
  // loading = true until the API confirms the role
  const [loading, setLoading] = useState(true);

  const setAuthSession = useCallback((authData = {}) => {
    const { token, role: newRole, userName: newName, userEmail: newEmail } = authData;
    if (token) {
      localStorage.setItem("token", token);
    }
    if (newRole) {
      setRole(newRole);
      localStorage.setItem("userRole", newRole);
    }
    if (newName !== undefined) {
      setUserName(newName);
      localStorage.setItem("userName", newName);
    }
    if (newEmail !== undefined) {
      setUserEmail(newEmail);
    }
    setLoading(false);
  }, []);

  const clearAuthSession = useCallback(() => {
    setRole("USER");
    setUserName("");
    setUserEmail("");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setLoading(false);
  }, []);

  const refreshRole = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      clearAuthSession();
      return;
    }
    try {
      const res = await API.get("/users/profile");
      const fetchedRole = res.data.role || "USER";
      const fetchedName = res.data.name || "";
      const fetchedEmail = res.data.email || "";

      // Always update from API — this is the authoritative source
      setRole(fetchedRole);
      setUserName(fetchedName);
      setUserEmail(fetchedEmail);

      // Keep localStorage in sync so next mount has the correct hint
      localStorage.setItem("userRole", fetchedRole);
      localStorage.setItem("userName", fetchedName);
    } catch (err) {
      if (err.response?.status === 401) {
        // Token expired — interceptor handles redirect
        clearAuthSession();
      } else {
        // Network / server error — keep current state, don't downgrade
        console.warn("RoleContext: could not refresh role from API", err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [clearAuthSession]);

  // Fetch authoritative role on every mount
  useEffect(() => {
    refreshRole();
  }, [refreshRole]);

  // Listen to custom auth events and storage events for cross-tab or in-tab synchronization
  useEffect(() => {
    const handleAuthChange = () => {
      refreshRole();
    };

    const handleStorage = (e) => {
      if (e.key === "token" && !e.newValue) {
        clearAuthSession();
      } else if (e.key === "userRole" && e.newValue) {
        setRole(e.newValue);
      }
    };

    window.addEventListener("budgetbuddy:authchange", handleAuthChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("budgetbuddy:authchange", handleAuthChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearAuthSession, refreshRole]);

  const value = {
    role,
    isUser: role === "USER",
    isPremium: role === "PREMIUM_USER",
    isAdmin: role === "ADMIN",
    isPremiumOrAdmin: role === "PREMIUM_USER" || role === "ADMIN",
    userName,
    userEmail,
    loading,
    refreshRole,
    setAuthSession,
    clearAuthSession
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export default RoleContext;
