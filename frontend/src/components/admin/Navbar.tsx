import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Package, Menu, LogOut, User } from "lucide-react";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth state whenever the location changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (token && role) {
      setIsAuthed(true);
      setUserRole(role);
    } else {
      setIsAuthed(false);
      setUserRole(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthed(false);
    setUserRole(null);
    setIsMenuOpen(false);
    navigate("/login");
  };

  // Styling constants
  const primaryBtnClasses =
    "inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm px-4 py-2 font-semibold hover:bg-blue-700 transition";
  const outlineBtnClasses =
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 text-sm px-4 py-2 font-semibold hover:bg-gray-50 transition";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        {/* TOP BAR */}
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-lg transition-transform group-hover:scale-105">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              MAR Transports
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Home
            </Link>

            <Link to="/tracking" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Track Shipment
            </Link>
            
            {/* ADDED CONTACT LINK */}
            <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Contact
            </Link>

            {/* GUEST LINKS */}
            {!isAuthed && (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Sign In
                </Link>
                <Link to="/signup" className={primaryBtnClasses}>
                  Book Now
                </Link>
              </>
            )}

            {/* CLIENT LINKS */}
            {isAuthed && userRole === "client" && (
              <>
                <Link to="/client/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to="/client/booking" className={primaryBtnClasses}>
                  Book Now
                </Link>
                <button onClick={handleLogout} className={outlineBtnClasses + " ml-2"} title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            {/* ADMIN LINKS */}
            {isAuthed && userRole === "admin" && (
              <>
                <Link to="/admin/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Admin Panel
                </Link>
                <button onClick={handleLogout} className={outlineBtnClasses + " ml-2"} title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-100 bg-white">
            <Link to="/" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/tracking" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>
              Track Shipment
            </Link>
            <Link to="/contact" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>

            {!isAuthed && (
              <>
                <Link to="/login" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/signup" className={`${primaryBtnClasses} w-full flex justify-center`} onClick={() => setIsMenuOpen(false)}>
                  Book Now
                </Link>
              </>
            )}

            {isAuthed && userRole === "client" && (
              <>
                <Link to="/client/dashboard" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/client/booking" className={`${primaryBtnClasses} w-full flex justify-center`} onClick={() => setIsMenuOpen(false)}>
                  New Booking
                </Link>
                <button onClick={handleLogout} className={`${outlineBtnClasses} w-full mt-2 flex justify-center gap-2`}>
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}

            {isAuthed && userRole === "admin" && (
              <>
                <Link to="/admin/dashboard" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>
                  Admin Dashboard
                </Link>
                <button onClick={handleLogout} className={`${outlineBtnClasses} w-full mt-2 flex justify-center gap-2`}>
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;