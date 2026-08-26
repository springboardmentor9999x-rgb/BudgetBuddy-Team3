import React from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "./AppLayout";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

export default ProtectedRoute;
