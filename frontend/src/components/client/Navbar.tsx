import { useState, useEffect } from "react";
import { User, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ✅ Correct active page detection
  const path = location.pathname;
  const currentPage =
    path === "/client"
      ? "home"
      : path.split("/")[2] || "home";

  const navItems = [
    { id: "home", label: "Home", path: "/client" },
    { id: "book", label: "Book Shipment", path: "/client/book" },
    { id: "track", label: "Track Shipment", path: "/client/track" },
    { id: "contact", label: "Contact Us", path: "/client/contact" },
  ];

  // 🔥 Scroll hide/show logic (UNCHANGED)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 80) {
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 w-full bg-white shadow-md z-50
        transition-transform duration-300 ease-in-out
        ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <h1
              onClick={() => navigate("/client")}
              className="text-2xl font-bold text-blue-600 cursor-pointer"
            >
              MAR Transports
            </h1>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => handleNavigate("/client/profile")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPage === "profile"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <User size={20} />
                <span className="text-sm font-medium">Profile</span>
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-700"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex justify-between items-center px-6 h-16 border-b">
            <h2 className="text-xl font-bold text-blue-600">
              MAR Transports
            </h2>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center space-y-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`text-2xl font-semibold transition-colors ${
                  currentPage === item.id
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => handleNavigate("/client/profile")}
              className="mt-6 flex items-center gap-3 text-2xl font-semibold text-gray-700 hover:text-blue-600"
            >
              <User size={26} />
              Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
}
