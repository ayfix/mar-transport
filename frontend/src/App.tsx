import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminRoutes from "./routes/AdminRoutes"; // Import the new module
import ClientRoutes from "./routes/ClientRoutes"; // Import the new module

const App: React.FC = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* MODULE ROUTING */}
      {/* The '*' tells React Router to match anything starting with /admin 
          and pass the rest of the path to AdminRoutes */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      {/* Same logic for client routes */}
      <Route path="/client/*" element={<ClientRoutes />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;