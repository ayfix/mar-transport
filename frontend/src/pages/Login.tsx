import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Import icons
import type { LoginResponse } from "../types";
import { loginUser } from "../api/userApi";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false); // State for visibility
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Make API Call
      const data: LoginResponse = await loginUser(email, password);

      // 2. Save Data in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);

      // 3. Role-based redirection
      const role = data.user.role;
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "client") {
        navigate("/client", { replace: true });
      } else {
        setError("User role not recognized");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const message =
        err?.response?.data?.message || "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        
        {/* LOGO + ROUTE DESCRIPTION */}
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-lg shadow-md flex items-center justify-center px-7 py-4 relative overflow-hidden">
            {/* Red gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-50/40 to-red-100/30" />
            <span className="text-3xl font-black tracking-wide text-red-600 relative z-10">
              MAR
            </span>
          </div>

          <h3 className="mt-4 text-center text-white text-xl font-bold">
            MAR SmartTrack
          </h3>

          <p className="mt-1 text-center text-slate-200 text-xs max-w-xs leading-relaxed">
            Reliable road logistics · Chennai → Ranipet → Ambur → Vaniyambadi → Gudiyattam → Bangalore
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white w-full rounded-xl shadow-xl p-8">
          <h2 className="text-center text-[#0f172a] text-xl font-extrabold">
            MAR SmartTrack & Dispatch
          </h2>
          <p className="text-center text-sm text-slate-500 mt-1">
            Login to your account
          </p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 
                           focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
                placeholder="Enter email"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-200 bg-slate-50 
                             focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white 
                         bg-gradient-to-br from-[#0ea5a4] to-[#0b897f] 
                         hover:from-[#0ca49f] hover:to-[#097b70] transition
                         disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-[#0ea5a4] font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </div>

        {/* CONTACT FOOTER */}
        <div className="text-center text-slate-400 text-xs pb-4">
          Contact: +91 79049 84997 • support@mar.com
        </div>
      </div>
    </div>
  );
};

export default Login;