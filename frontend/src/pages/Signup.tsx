// src/pages/Signup.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Import icons
import type { LoginResponse } from "../types";
import { signupUser } from "../api/userApi";

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle state

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null); // API specific error
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({}); // Field specific errors

  // Helper validation function
  const validateField = (fieldName: string, value: string) => {
    let error = "";
    if (fieldName === "phone") {
      if (value.length > 0 && value.length !== 10) {
        error = "Phone must be exactly 10 digits";
      }
    }
    if (fieldName === "email") {
       if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Please enter a valid email address";
      }
    }
    return error;
  };

  // Input Handlers with Blocking Logic
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setName(val);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Block non-numbers and length > 10
    if (/^\d*$/.test(val) && val.length <= 10) {
      setPhone(val);
      
      // Clear error while typing if valid
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);

    // Real-time validation
    const error = validateField("email", val);
    if (error) {
      setValidationErrors((prev) => ({ ...prev, email: error }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handlePhoneBlur = () => {
    const error = validateField("phone", phone);
    if (error) {
      setValidationErrors((prev) => ({ ...prev, phone: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    // Final Validation
    const phoneError = validateField("phone", phone);
    const emailError = validateField("email", email);

    if (phoneError || emailError) {
      setValidationErrors((prev) => ({
        ...prev,
        phone: phoneError || prev.phone,
        email: emailError || prev.email,
      }));
      return;
    }

    setLoading(true);

    try {
      const data: LoginResponse = await signupUser({
        name,
        company,
        email,
        phone,
        password,
      });

      // store token + user just like login
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);

      // since this is client signup, send to client dashboard
      if (data.user.role === "client") {
        navigate("/client");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* LOGO + TEXT */}
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-lg shadow-md flex items-center justify-center px-7 py-4 relative overflow-hidden">
            {/* Red gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-50/40 to-red-100/30" />
            <span className="text-3xl font-black tracking-wide text-red-600 relative z-10">
              MAR
            </span>
          </div>
          <h3 className="mt-3 text-center text-white text-lg font-bold">
            MAR SmartTrack
          </h3>

          <p className="mt-1 text-center text-slate-200 text-xs max-w-xs leading-tight">
            Reliable road logistics · Chennai → Ranipet → Ambur → Vaniyambadi → Gudiyattam → Bangalore
          </p>
        </div>

        {/* SIGNUP CARD */}
        <div className="bg-white w-full rounded-xl shadow-xl p-6">
          <h2 className="text-center text-[#0f172a] text-lg font-bold">
            Create Client Account
          </h2>
          <p className="text-center text-xs text-slate-500 mt-1">
            Sign up to book shipments
          </p>

          {apiError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={name}
                required
                onChange={handleNameChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 
                           focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company (optional)
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 
                           focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                required
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-slate-50 
                           focus:outline-none focus:ring-2 focus:ring-[#1e293b] ${
                             validationErrors.phone ? "border-red-500" : "border-slate-200"
                           }`}
                placeholder="Enter phone number"
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                required
                onChange={handleEmailChange}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-slate-50 
                           focus:outline-none focus:ring-2 focus:ring-[#1e293b] ${
                             validationErrors.email ? "border-red-500" : "border-slate-200"
                           }`}
                placeholder="Enter email"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 bg-slate-50 
                             focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm rounded-lg font-semibold text-white 
                         bg-gradient-to-br from-[#0ea5a4] to-[#0b897f] 
                         hover:from-[#0ca49f] hover:to-[#097b70] transition
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-3">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#0ea5a4] font-semibold hover:text-[#0b897f] transition-colors"
            >
              Login
            </Link>
          </p>
        </div>

        {/* CONTACT */}
        <div className="text-center text-slate-300 text-xs">
          Contact: +91 79049 84997 • support@mar.com
        </div>
      </div>
    </div>
  );
};

export default Signup;