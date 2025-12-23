import React from "react";
import { Routes, Route } from "react-router-dom";
import ClientLayout from "../pages/client/ClientLayout";
import Home from "../pages/client/Home";
import BookShipment from "../pages/client/BookShipment";
import TrackShipment from "../pages/client/TrackShipment";
import ContactUs from "../pages/client/ContactUs";
import Profile from "../pages/client/ClientProfile";
import ProtectedRoute from "../components/admin/ProtectedRoute";

const ClientRoutes: React.FC = () => {
  return (
    <Routes>
      {/* This wrapper ensures all client routes are:
        1. Protected (checked for 'client' role)
        2. Rendered inside the ClientLayout (sidebar/navbar)
      */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="book" element={<BookShipment />} />
        <Route path="track" element={<TrackShipment />} />
        <Route path="contact" element={<ContactUs />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default ClientRoutes;