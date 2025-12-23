import React, { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  Save, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Lock,
  Building
} from "lucide-react";
import { AdminApi } from "../../api/adminApi"; 

// Interface for type safety
interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  company: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Interface for validation errors
interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

const AdminProfile: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [lastLoginTime, setLastLoginTime] = useState("");

  // Validation State
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: "",
    email: "",
    phone: "",
    role: "Admin", 
    company: "MAR Transports",
    currentPassword: "", 
    newPassword: "",
    confirmPassword: "",
  });

  // Load initial data & Set Last Login Time
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setProfileData(prev => ({
          ...prev,
          fullName: parsedUser.name || "",
          email: parsedUser.email || "",
          phone: parsedUser.phone || "",
          role: parsedUser.role ? parsedUser.role.charAt(0).toUpperCase() + parsedUser.role.slice(1) : "Admin",
          company: parsedUser.company || "MAR Transports"
        }));
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    };
    setLastLoginTime(`Today, ${now.toLocaleTimeString('en-US', options)}`);
  }, []);

  // --- VALIDATION LOGIC ---
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "fullName":
        // No error message needed as input is masked, 
        // but we can check for empty if required.
        if (value.trim().length === 0) return "Name cannot be empty.";
        return "";

      case "phone":
        if (value.length > 0 && value.length < 10) {
          return "Phone number must be exactly 10 digits.";
        }
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.length > 0 && !emailRegex.test(value)) {
          return "Please enter a valid email address.";
        }
        break;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    
    // --- SPECIAL HANDLING FOR PHONE (No letters, max 10 digits) ---
    if (name === "phone") {
      value = value.replace(/\D/g, ''); // Remove non-digits
      if (value.length > 10) {
        value = value.slice(0, 10); // Cap at 10
      }
    }

    // --- SPECIAL HANDLING FOR NAME (No numbers allowed) ---
    if (name === "fullName") {
      value = value.replace(/\d/g, ''); // Remove digits
    }

    // Update data with refined value
    setProfileData((prev) => ({ ...prev, [name]: value }));

    // Run validation on the new value
    const errorMsg = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Final Validation Check before API call
    const nameError = validateField("fullName", profileData.fullName);
    const emailError = validateField("email", profileData.email);
    const phoneError = validateField("phone", profileData.phone);

    if (nameError || emailError || phoneError) {
      setErrors({ fullName: nameError, email: emailError, phone: phoneError });
      setMessage({ type: 'error', text: "Please fix the validation errors before saving." });
      setLoading(false);
      return;
    }

    try {
      // 1. Update Profile Details
      const profilePayload = {
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
      };
      
      const profileResponse = await AdminApi.updateProfile(profilePayload);
      
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...profileResponse.admin }));

      let passwordMsg = "";

      // 2. Update Password Validation
      if (profileData.newPassword) {
        if (profileData.newPassword.length < 7) {
             throw new Error("New password must be at least 7 characters long.");
        }
        if (profileData.newPassword !== profileData.confirmPassword) {
            throw new Error("New passwords do not match.");
        }
        if (!profileData.currentPassword) {
            throw new Error("Current password is required to set a new password.");
        }

        await AdminApi.updatePassword({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        });
        passwordMsg = " and Password";
        
        // Clear sensitive fields
        setProfileData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      }

      setMessage({ type: 'success', text: `Profile${passwordMsg} updated successfully!` });

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "An error occurred";
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
            <p className="mt-1 text-gray-500">Manage your profile details and security preferences.</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 shadow-sm">
               Last login: {lastLoginTime}
             </span>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium border ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  <User size={48} className="text-blue-400" />
              </div>
              
              <h2 className="mt-5 text-xl font-bold text-gray-900">{profileData.fullName || "Admin User"}</h2>
              <p className="text-gray-500 text-sm">{profileData.email || "admin@example.com"}</p>
              
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase tracking-wide">
                    <ShieldCheck size={12} /> {profileData.role}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-semibold text-lg">System Status</h3>
                <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></div>
                    <div>
                        <p className="text-white font-medium">Active</p>
                        <p className="text-xs">Secure Connection</p>
                    </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. GENERAL INFORMATION */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <User size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">General Information</h3>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      name="fullName" 
                      value={profileData.fullName} 
                      onChange={handleChange} 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 font-medium">{errors.fullName}</p>}
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      name="email" 
                      value={profileData.email} 
                      onChange={handleChange} 
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        errors.email ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200" : "border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500/20"
                      } focus:bg-white focus:ring-2 transition-all outline-none`} 
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                </div>

                {/* Phone Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      name="phone" 
                      value={profileData.phone} 
                      onChange={handleChange} 
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        errors.phone ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200" : "border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500/20"
                      } focus:bg-white focus:ring-2 transition-all outline-none`} 
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Company</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input type="text" name="company" value={profileData.company} disabled className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SECURITY */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Lock size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">Security</h3>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Current Password Field */}
                <div className="space-y-2 md:col-span-2">
                   <label className="text-sm font-semibold text-gray-700">Current Password <span className="text-gray-400 font-normal">(Required to save changes)</span></label>
                   <input
                       type="password"
                       name="currentPassword"
                       value={profileData.currentPassword}
                       onChange={handleChange}
                       placeholder="Enter current password"
                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                   />
                </div>

                {/* New Password Field with dynamic helper text */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">New Password</label>
                  <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={profileData.newPassword}
                        onChange={handleChange}
                        placeholder="Min 7 characters"
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          profileData.newPassword && profileData.newPassword.length < 7 
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200" 
                          : "border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500/20"
                        } transition-all outline-none pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Enterprise Level Helper Text */}
                  <p className={`text-xs mt-1 transition-colors ${
                      profileData.newPassword && profileData.newPassword.length < 7 
                      ? "text-red-500 font-medium" 
                      : "text-gray-400"
                  }`}>
                      {profileData.newPassword && profileData.newPassword.length < 7 
                        ? "Password is too short (min 7 chars)" 
                        : "Minimum 7 characters"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                  <input
                      type="password"
                      name="confirmPassword"
                      value={profileData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Min 7 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                <button type="button" onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Discard
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;