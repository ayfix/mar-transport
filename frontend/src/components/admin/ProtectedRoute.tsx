import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// 1. Make children optional in the interface
interface ProtectedRouteProps {
  allowedRoles: string[];
  children?: React.ReactNode; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  // Replace this with your actual auth logic (Context, Redux, or localStorage)
  const userRole = localStorage.getItem("role"); // Example: 'admin' or 'client'
  const isAuthenticated = !!userRole; 
  
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 2. If 'children' are passed (Old way), render them.
  //    If not (New modular way), render <Outlet /> which acts as a placeholder for child routes.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;