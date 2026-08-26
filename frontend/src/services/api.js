import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to dynamically attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for handling token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 if user was logged in
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Global real-time event dispatcher for synchronized UI updates
export const notifyDataChanged = (detail = {}) => {
  const event = new CustomEvent("budgetbuddy:datachange", { detail });
  window.dispatchEvent(event);
};

export const onDataChanged = (callback) => {
  const handler = (e) => callback(e.detail);
  window.addEventListener("budgetbuddy:datachange", handler);
  return () => window.removeEventListener("budgetbuddy:datachange", handler);
};

export default API;