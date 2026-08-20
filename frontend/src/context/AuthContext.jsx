import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // ==========================================================
  // AUTH STATE
  // ==========================================================

  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // LOAD CURRENT USER
  // ==========================================================

  useEffect(() => {
    const loadUser = async () => {
      // No token → user is not logged in
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await api.get("/auth/me");

        setUser(response.data);
      } catch (error) {
        console.error(
          "Failed to load user:",
          error
        );

        // Token is invalid or expired
        localStorage.removeItem("token");

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // ==========================================================
  // SIGNUP
  // ==========================================================

  const signup = async (userData) => {
    return await api.post(
      "/auth/signup",
      userData
    );
  };

  // ==========================================================
  // RESEND VERIFICATION EMAIL
  // ==========================================================

  const resendVerification = async (email) => {
    const response = await api.post(
      "/auth/resend-verification",
      {
        email: email.trim(),
      }
    );

    return response.data;
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (email, password) => {
    const formData = new URLSearchParams();

    formData.append(
      "username",
      email
    );

    formData.append(
      "password",
      password
    );

    const response = await api.post(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken =
      response.data.access_token;

    // Save token
    localStorage.setItem(
      "token",
      accessToken
    );

    // Update token state
    setToken(accessToken);
  };

  // ==========================================================
  // UPDATE USER
  // ==========================================================

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        signup,
        resendVerification,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================================
// USE AUTH HOOK
// ==========================================================

export const useAuth = () =>
  useContext(AuthContext);