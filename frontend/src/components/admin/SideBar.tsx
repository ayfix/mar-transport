import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Box,
  Repeat,
  Truck,
  BarChart2,
  User,
  LogOut,
  X, // Close icon for mobile
} from "lucide-react";
import type { User as UserType } from "../../types";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as UserType;
        setUser(parsed);
      } catch {
        localStorage.clear();
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const items = [
    { to: "/admin/dashboard", label: "Dashboard", Icon: Home },
    { to: "/admin/shipments", label: "Shipments", Icon: Box },
    { to: "/admin/dispatch", label: "Dispatch", Icon: Repeat },
    { to: "/admin/fleet", label: "Fleet", Icon: Truck },
    { to: "/admin/reports", label: "Reports", Icon: BarChart2 },
    { to: "/admin/profile", label: "Profile", Icon: User },
  ];

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  const initial = user && user.name ? user.name.charAt(0).toUpperCase() : "A";
  const displayName = user?.name || "Administrator";
  const displayEmail = user?.email || "admin@mar.com";

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col relative">
      
      {/* Mobile Close Button */}
      <button 
        onClick={onClose}
        className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header / Logo */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-4">
        <div
          className="bg-white rounded-lg p-2 shadow flex items-center justify-center shrink-0"
          style={{ width: 56, height: 56 }}
        >
          <span className="text-red-700 font-extrabold text-lg tracking-wide">
            MAR
          </span>
        </div>
        <div>
          <div className="font-semibold text-white">MAR SmartTrack</div>
          <div className="text-xs text-slate-300">
            {user?.role === "admin" ? "Admin Portal" : "Client Portal"}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 px-6 mb-4">
        Reliable road logistics · Ambur → Chennai → Bangalore
      </p>

      {/* Navigation Links */}
      <nav className="flex-1 mt-2 px-2">
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.to}>
              <NavLink
                to={it.to}
                onClick={onClose} // Auto-close on mobile
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <it.Icon className="w-5 h-5" />
                <span>{it.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Profile */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm text-white shrink-0">
            {initial}
          </div>
          <div className="text-sm overflow-hidden">
            <div className="font-semibold text-slate-100 truncate">
              {displayName}
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[140px]" title={displayEmail}>
              {displayEmail}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 justify-center rounded-md bg-slate-800 hover:bg-slate-700 py-2 text-slate-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}