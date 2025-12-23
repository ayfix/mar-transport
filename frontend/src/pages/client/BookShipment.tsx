import { useState, useEffect } from "react";
import { Package, Calendar, Phone, Mail, MapPin, FileText } from "lucide-react";
import { createShipment } from "../../api/shipmentsApi";
import { getClientProfile } from "../../api/clientProfileApi"; // Import profile API

interface BookingFormData {
  pickup_location: string;
  destination: string;
  goods_type: string;
  pickup_date: string;
  quantity: number;
  weight: number;
  priority: string;
  goods_description: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  pickup_address: string;
  special_instructions: string;
}

export default function BookShipment() {
  const [formData, setFormData] = useState<BookingFormData>({
    pickup_location: "",
    destination: "",
    goods_type: "",
    pickup_date: "",
    quantity: 10,
    weight: 100,
    priority: "medium",
    goods_description: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    pickup_address: "",
    special_instructions: "",
  });

  // New state for validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const today = new Date().toISOString().split('T')[0];

  const COST_PER_KM = 6;
  const COST_PER_KG = 0.5;
  const COST_PER_UNIT = 2;

  const distanceMatrix: Record<string, Record<string, number>> = {
    ambur: {
      "chennai port": 215,
      "chennai airport": 210,
      "bangalore airport": 190,
    },
    vaniyambadi: {
      "chennai port": 220,
      "chennai airport": 215,
      "bangalore airport": 185,
    },
    ranipet: {
      "chennai port": 115,
      "chennai airport": 110,
      "bangalore airport": 260,
    },
    gudiyatham: {
      "chennai port": 245,
      "chennai airport": 240,
      "bangalore airport": 165,
    },
    pallavaram: {
      "chennai port": 25,
      "chennai airport": 5,
      "bangalore airport": 345,
    },
    chennai: {
      "chennai port": 15,
      "chennai airport": 20,
      "bangalore airport": 350,
    },
    bangalore: {
      "chennai port": 345,
      "chennai airport": 340,
      "bangalore airport": 25,
    },
  };

  const pickupLocations = [
    "Ambur",
    "Vaniyambadi",
    "Ranipet",
    "Gudiyatham",
    "Pallavaram",
    "Chennai",
    "Bangalore",
  ];

  const destinations = ["Chennai Port", "Chennai Airport", "Bangalore Airport"];

  const goodsTypes = [
    "Leather products",
    "Chemicals",
    "Groceries",
    "Steel Items",
    "Textiles",
    "Furniture",
    "Other",
  ];

  const priorities = ["Low", "Medium", "High"];

  const priorityMultipliers: { [key: string]: number } = {
    low: 1,
    medium: 1.3,
    high: 1.7,
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await getClientProfile();
        const profile = res.data.data;
        setFormData((prev) => ({
          ...prev,
          contact_name: profile.name || "",
          contact_email: profile.email || "",
          contact_phone: profile.phone || "",
          pickup_address: profile.address || "",
        }));
      } catch (err) {
        console.error("Failed to load profile for auto-fill", err);
      }
    };
    fetchProfileData();
  }, []);

  useEffect(() => {
    const price = calculatePrice();
    setEstimatedPrice(price);
  }, [
    formData.goods_type,
    formData.quantity,
    formData.weight,
    formData.priority,
    formData.pickup_location,
    formData.destination,
  ]);

  const calculatePrice = () => {
    if (
      !formData.goods_type ||
      !formData.pickup_location ||
      !formData.destination
    ) {
      return 0;
    }

    const pickup = formData.pickup_location.trim().toLowerCase();
    const destination = formData.destination.trim().toLowerCase();

    const goodsTypeMap: Record<string, string> = {
      "leather products": "leather products",
      "chemicals": "chemicals",
      "groceries": "grocery",
      "steel items": "steel items",
      "textiles": "textiles",
      "furniture": "furniture",
      "other": "others",
    };

    const normalizedGoods =
      goodsTypeMap[formData.goods_type.trim().toLowerCase()] || "others";

    const basePrices: Record<string, number> = {
      "leather products": 100,
      "chemicals": 80,
      "grocery": 70,
      "steel items": 200,
      "textiles": 90,
      "furniture": 120,
      "others": 80,
    };

    const basePrice = basePrices[normalizedGoods];
    const distance = distanceMatrix[pickup]?.[destination];
    if (!distance) return 0;

    const distanceCost = distance * COST_PER_KM;
    const weightCost = Number(formData.weight) * COST_PER_KG;
    const quantityCost = Number(formData.quantity) * COST_PER_UNIT;
    const multiplier = priorityMultipliers[formData.priority.trim().toLowerCase()] || 1;
    const total = (basePrice + distanceCost + weightCost + quantityCost) * multiplier;

    return Math.round(total);
  };

  // Helper validation function for Blur/Submit checks
  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "contact_phone") {
      if (value.length > 0 && value.length !== 10) {
        error = "Phone must be exactly 10 digits";
      }
    }
    if (name === "contact_email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Please enter a valid email address";
      }
    }
    return error;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // --- INPUT BLOCKING LOGIC ---

    // Name: Block if it contains anything other than letters or spaces
    if (name === "contact_name") {
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        return; // Do not update state
      }
    }

    // Phone: Block if it contains non-numbers OR if length > 10
    if (name === "contact_phone") {
      if (!/^\d*$/.test(value)) {
        return; // Block non-numbers
      }
      if (value.length > 10) {
        return; // Block more than 10 digits
      }
    }

    // Update state if validation passes
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // --- REAL-TIME ERROR DISPLAY LOGIC ---

    // Email: Show error immediately while typing
    if (name === "contact_email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setErrors((prev) => ({ ...prev, [name]: "Invalid email format" }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    // Clear Phone/Name errors from "submit" check if user is fixing them
    if (name === "contact_phone") {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  // Handle Blur for checks that shouldn't happen while typing (like "minimum" length)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Only check min-length for phone here
    // Name doesn't need blur check as we blocked bad input
    // Email is already checked in real-time
    if (name === "contact_phone") {
        const error = validateField(name, value);
        if (error) {
          setErrors((prev) => ({ ...prev, [name]: error }));
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Final Validation Check
    const phoneError = validateField("contact_phone", formData.contact_phone);
    const emailError = validateField("contact_email", formData.contact_email);

    if (phoneError || emailError) {
      setErrors((prev) => ({
        ...prev,
        contact_phone: phoneError || prev.contact_phone,
        contact_email: emailError || prev.contact_email
      }));
      setErrorMessage("Please fix the errors in the contact details.");
      setIsSubmitting(false);
      return;
    }

    // Ensure phone is exactly 10 (double check)
    if (formData.contact_phone.length !== 10) {
        setErrors((prev) => ({ ...prev, contact_phone: "Phone must be exactly 10 digits" }));
        setErrorMessage("Please fix the errors in the contact details.");
        setIsSubmitting(false);
        return;
    }

    if (
      !formData.pickup_location ||
      !formData.destination ||
      !formData.goods_type ||
      !formData.contact_name ||
      !formData.contact_phone ||
      !formData.contact_email ||
      !formData.pickup_address
    ) {
      setErrorMessage("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        pickupLocation: formData.pickup_location,
        deliveryLocation: formData.destination,
        goodsType: formData.goods_type,
        quantity: formData.quantity,
        weight: formData.weight,
        priority: formData.priority,
        description: formData.goods_description,
        contactName: formData.contact_name,
        contactPhone: formData.contact_phone,
        contactEmail: formData.contact_email,
        pickupAddress: formData.pickup_address,
        specialInstructions: formData.special_instructions,
      };

      const res = await createShipment(payload);

      setSuccessMessage(
        `Booking confirmed! Your tracking ID is: ${res.shipment.trackingId}`
      );

      setFormData((prev) => ({
        ...prev,
        pickup_location: "",
        destination: "",
        goods_type: "",
        pickup_date: "",
        quantity: 10,
        weight: 100,
        priority: "medium",
        goods_description: "",
        special_instructions: "",
      }));
    } catch (error: any) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to create booking"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-20 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Book Your Shipment
            </h1>
            <p className="text-gray-600">
              Fill in the details below to schedule your shipment
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pickup Location <span className="text-red-500">*</span>
                </label>
                <select
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select location</option>
                  {pickupLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination <span className="text-red-500">*</span>
                </label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select destination</option>
                  {destinations.map((dest) => (
                    <option key={dest} value={dest}>
                      {dest}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type of Goods <span className="text-red-500">*</span>
                </label>
                <select
                  name="goods_type"
                  value={formData.goods_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select goods type</option>
                  {goodsTypes.map((goods) => (
                    <option key={goods} value={goods}>
                      {goods}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pickup Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    name="pickup_date"
                    min={today}
                    value={formData.pickup_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity (units) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority.toLowerCase()}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estimated Price
                </label>
                <div className="bg-green-50 border-2 border-green-500 rounded-lg px-4 py-2">
                  <span className="text-2xl font-bold text-green-700">
                    ₹{estimatedPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Goods Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  name="goods_description"
                  value={formData.goods_description}
                  onChange={handleInputChange}
                  placeholder="Describe your goods..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      errors.contact_name
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                  {errors.contact_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.contact_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.contact_phone
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      required
                    />
                  </div>
                  {errors.contact_phone && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.contact_phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.contact_email
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      required
                    />
                  </div>
                  {errors.contact_email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.contact_email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pickup Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="pickup_address"
                      value={formData.pickup_address}
                      onChange={handleInputChange}
                      placeholder="Full pickup address..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg"
              >
                {isSubmitting ? 'Confirming Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}