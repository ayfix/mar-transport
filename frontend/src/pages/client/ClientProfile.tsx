import { useState, useEffect } from "react";
import {
  User,
  Building,
  Mail,
  Phone,
  Lock,
  Save,
  MapPin,
  Package,
  CheckCircle,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";

import {
  getClientProfile,
  updateClientProfile,
  changeClientPassword,
  getActiveClientShipments,
  getDeliveredClientShipments,
} from "../../api/clientProfileApi";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<
    "details" | "password" | "active" | "delivered"
  >("details");
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const [deliveredShipments, setDeliveredShipments] = useState<any[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const tabs = [
    ["details", "Details", User],
    ["password", "Password", Lock],
    ["active", "Active", Package],
    ["delivered", "Delivered", CheckCircle],
  ];

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    pickup_address: "",
  });

  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });

  // State for toggling password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // State for Global Success/Error messages
  const [successMessage, setSuccessMessage] = useState("");
  const [apiErrorMessage, setApiErrorMessage] = useState("");

  /* ================= CLEAR MESSAGES ON TAB CHANGE ================= */
  useEffect(() => {
    setSuccessMessage("");
    setApiErrorMessage("");
    setErrors({});
  }, [activeTab]);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getClientProfile();
        const u = res.data.data;

        setProfileData({
          full_name: u.name,
          email: u.email,
          phone: u.phone || "",
          company: u.company || "",
          pickup_address: u.address || "",
        });
      } catch (err) {
        console.error("Profile load failed", err);
      }
    };

    loadProfile();
  }, []);

  // Helper validation function
  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "phone") {
      if (value.length > 0 && value.length !== 10) {
        error = "Phone must be exactly 10 digits";
      }
    }
    return error;
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // --- INPUT BLOCKING LOGIC ---
    if (name === "full_name") {
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        return;
      }
    }

    if (name === "phone") {
      if (!/^\d*$/.test(value)) {
        return;
      }
      if (value.length > 10) {
        return;
      }
    }

    setProfileData((prev) => ({ ...prev, [name]: value }));

    if (name === "phone") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProfileBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const error = validateField(name, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= SAVE PROFILE ================= */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setApiErrorMessage("");

    const phoneError = validateField("phone", profileData.phone);
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }
    if (profileData.phone.length !== 10) {
      setErrors((prev) => ({
        ...prev,
        phone: "Phone must be exactly 10 digits",
      }));
      return;
    }

    try {
      await updateClientProfile({
        name: profileData.full_name,
        phone: profileData.phone,
        company: profileData.company,
        address: profileData.pickup_address,
      });
      setSuccessMessage("Profile updated successfully");
      setErrors({});
    } catch (err: any) {
      setApiErrorMessage(err.response?.data?.message || "Update failed");
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setApiErrorMessage("");

    if (passwordData.new_password !== passwordData.confirm_password) {
      setApiErrorMessage("Passwords do not match");
      return;
    }

    try {
      await changeClientPassword(passwordData);
      setSuccessMessage("Password changed successfully");
      setPasswordData({ new_password: "", confirm_password: "" });
    } catch (err: any) {
      setApiErrorMessage(
        err.response?.data?.message || "Password update failed"
      );
    }
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setLoadingShipments(true);

        if (activeTab === "active") {
          const res = await getActiveClientShipments();
          setActiveShipments(res.data);
        }

        if (activeTab === "delivered") {
          const res = await getDeliveredClientShipments();
          setDeliveredShipments(res.data);
        }
      } catch (err) {
        console.error("Failed to load shipments", err);
      } finally {
        setLoadingShipments(false);
      }
    };

    if (activeTab === "active" || activeTab === "delivered") {
      loadShipments();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto sm:mx-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold">
                {profileData.full_name}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base break-all">
                {profileData.email}
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-gray-100 p-2 rounded-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tabs.map(([key, label, Icon]: any) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition ${
                  activeTab === key
                    ? "bg-white text-blue-600 shadow"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={
            activeTab === "active" || activeTab === "delivered"
              ? "" // No padding for shipment lists
              : "p-8 space-y-6" // Padding for forms
          }
        >
          {/* CLIENT DETAILS */}
          {activeTab === "details" && (
            <form className="space-y-5" onSubmit={handleProfileSubmit}>
              {/* MESSAGES ON TOP */}
              {successMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium border border-green-200">
                  {successMessage}
                </div>
              )}
              {apiErrorMessage && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium border border-red-200">
                  {apiErrorMessage}
                </div>
              )}

              {[
                ["full_name", "Full Name", User],
                ["email", "Email", Mail],
                ["phone", "Phone Number", Phone],
                ["company", "Company", Building],
                ["pickup_address", "Pickup Address", MapPin],
              ].map(([key, label, Icon]: any) => (
                <div key={key}>
                  <label className="block text-sm font-semibold mb-2">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      name={key}
                      value={(profileData as any)[key]}
                      onChange={handleProfileChange}
                      onBlur={handleProfileBlur}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors[key] ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                      required
                      disabled={key === "email"}
                    />
                  </div>
                  {errors[key] && (
                    <p className="text-red-600 text-sm mt-1">{errors[key]}</p>
                  )}
                </div>
              ))}

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2">
                <Save size={18} /> Save Changes
              </button>
              {/* LOGOUT */}
              <div className="pt-6 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </form>
          )}

          {/* CHANGE PASSWORD */}
          {activeTab === "password" && (
            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
              {/* MESSAGES ON TOP */}
              {successMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium border border-green-200">
                  {successMessage}
                </div>
              )}
              {apiErrorMessage && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium border border-red-200">
                  {apiErrorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2">
                <Lock size={18} /> Change Password
              </button>
            </form>
          )}
        </div>

        {activeTab === "active" && (
          <>
            {loadingShipments && (
              <p className="text-center text-gray-500 mt-5">
                Loading shipments...
              </p>
            )}

            {!loadingShipments && activeShipments.length === 0 && (
              <p className="text-center text-gray-400 mt-5">
                No active shipments
              </p>
            )}

            {!loadingShipments &&
              activeShipments.map((s) => (
                <ShipmentCard key={s._id} s={s} active />
              ))}
          </>
        )}
        {activeTab === "delivered" && (
          <>
            {loadingShipments && (
              <p className="text-center text-gray-500 mt-5">
                Loading shipments...
              </p>
            )}

            {!loadingShipments && deliveredShipments.length === 0 && (
              <p className="text-center text-gray-400 mt-5">
                No delivered shipments
              </p>
            )}

            {!loadingShipments &&
              deliveredShipments.map((s) => <ShipmentCard key={s._id} s={s} />)}
          </>
        )}
      </div>
    </div>
  );
}

const ShipmentCard = ({ s, active }: any) => (
  <div
    className={`border rounded-lg p-6 my-5 mx-5 ${
      active ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
    }`}
  >
    <div className="flex justify-between mb-4">
      <div>
        <h3 className="font-semibold text-lg">{s.goodsType}</h3>
        <p className="text-sm text-gray-600 font-mono">ID: {s.trackingId}</p>
      </div>

      <span
        className={`h-8 px-5 inline-flex items-center justify-center rounded-full text-xs font-semibold whitespace-nowrap ${
          active ? "bg-blue-200 text-blue-800" : "bg-green-200 text-green-800"
        }`}
      >
        {active ? s.status : "Delivered"}
      </span>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <Info label="From" value={s.pickupLocation} />
      <Info label="To" value={s.deliveryLocation} />
      <Info label="Quantity" value={`${s.quantity}`} />
      <Info label="Weight" value={`${s.weight} kg`} />
      <Info label="Priority" value={s.priority} />
      <Info label="Price" value={`₹${s.price}`} />
    </div>
  </div>
);

const Info = ({ label, value }: any) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold">{value || "-"}</p>
  </div>
);