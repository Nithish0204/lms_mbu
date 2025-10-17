import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard based on role
    return (
      <Navigate
        to={
          user.role === "Teacher" ? "/teacher-dashboard" : "/student-dashboard"
        }
        replace
      />
    );
  }
  return children;
};

export default ProtectedRoute;
