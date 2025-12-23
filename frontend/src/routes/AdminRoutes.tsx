import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import ProtectedRoute from "../components/admin/ProtectedRoute";

const AdminRoutes: React.FC = () => {
  // You can define specific props here or fetch them from a context
  const adminProps = {
    userName: "Administrator",
  };

  return (
    <Routes>
      {/* Default redirect to dashboard if user hits /admin */}
      <Route path="/" element={<Navigate to="dashboard" replace />} />

      <Route
        element={<ProtectedRoute allowedRoles={["admin"]} />}
      >
        <Route path="dashboard" element={<AdminDashboard {...adminProps} activeTab="overview" />} />
        <Route path="shipments" element={<AdminDashboard {...adminProps} activeTab="shipments" />} />
        <Route path="dispatch" element={<AdminDashboard {...adminProps} activeTab="dispatch" />} />
        <Route path="fleet" element={<AdminDashboard {...adminProps} activeTab="fleet" />} />
        <Route path="reports" element={<AdminDashboard {...adminProps} activeTab="reports" />} />
        <Route path="profile" element={<AdminDashboard {...adminProps} activeTab="profile" />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;