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
    () => sessionStorage.getItem("token")
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

        const response = await api.get(
          "/auth/me"
        );

        setUser(response.data);

      } catch (error) {

        console.error(
          "Failed to load user:",
          error
        );

        sessionStorage.removeItem(
          "token"
        );

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

  const resendVerification = async (
    email
  ) => {

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

  const login = async (
    email,
    password
  ) => {

    const formData =
      new URLSearchParams();

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
    // sessionStorage keeps each browser tab's
    // authentication session separate.
    sessionStorage.setItem(
      "token",
      accessToken
    );

    // Update token state
    setToken(accessToken);

  };


  // ==========================================================
  // UPDATE USER
  // ==========================================================

  const updateUser = (
    updatedUser
  ) => {

    setUser(updatedUser);

  };


  // ==========================================================
  // REFRESH USER
  //
  // Re-fetches the current user from the backend (e.g. after
  // the role changes server-side, such as starting a Premium
  // trial) and updates auth state so the rest of the app
  // (like AnalyticsDashboard) re-renders with the new access
  // level immediately — no page reload required.
  // ==========================================================

  const refreshUser = async () => {

    if (!token) {

      return null;

    }

    const response = await api.get(
      "/auth/me"
    );

    setUser(response.data);

    return response.data;

  };


  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  const deleteAccount = async () => {

    try {

      await api.delete(
        "/auth/me"
      );

      // ------------------------------------------------------
      // DELETE TOKEN
      // ------------------------------------------------------

      sessionStorage.removeItem(
        "token"
      );

      // ------------------------------------------------------
      // CLEAR AUTH STATE
      // ------------------------------------------------------

      setToken(null);
      setUser(null);

      return true;

    } catch (error) {

      console.error(
        "Failed to delete account:",
        error
      );

      throw error;

    }

  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {

    sessionStorage.removeItem(
      "token"
    );

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
        refreshUser,
        deleteAccount,
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