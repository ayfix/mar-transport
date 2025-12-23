import { useState } from "react";
import { Mail, Phone, MapPin, Clock, AlertCircle } from "lucide-react";
import { sendContactMessage } from "../../api/ContactApi";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    full_name: "",
    // company: "",
    email: "",
    subject: "",
    phone: "",
    message: "",
  });

  // New state for validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Validation helper
  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "phone") {
      if (value.length > 0 && value.length !== 10) {
        error = "Phone must be exactly 10 digits";
      }
    }
    if (name === "email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Please enter a valid email address";
      }
    }
    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // --- INPUT BLOCKING LOGIC ---

    // Name: Block if it contains anything other than letters or spaces
    if (name === "full_name") {
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        return; // Do not update state
      }
    }

    // Phone: Block if it contains non-numbers OR if length > 10
    if (name === "phone") {
      if (!/^\d*$/.test(value)) {
        return; // Block non-numbers
      }
      if (value.length > 10) {
        return; // Block more than 10 digits
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // --- REAL-TIME ERROR DISPLAY LOGIC ---

    // Email: Show error immediately while typing
    if (name === "email") {
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

    // Clear Phone error while typing (if user is correcting length)
    if (name === "phone") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Check min-length for phone on blur
    if (name === "phone") {
        const error = validateField(name, value);
        if (error) {
          setErrors((prev) => ({ ...prev, [name]: error }));
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    // Final Validation Check
    const phoneError = validateField("phone", formData.phone);
    const emailError = validateField("email", formData.email);

    if (phoneError || emailError) {
      setErrors((prev) => ({
        ...prev,
        phone: phoneError || prev.phone,
        email: emailError || prev.email
      }));
      setLoading(false);
      return;
    }

    // Double check specific 10 digit requirement
    if (formData.phone.length !== 10) {
        setErrors((prev) => ({ ...prev, phone: "Phone must be exactly 10 digits" }));
        setLoading(false);
        return;
    }

    try {
      const res = await sendContactMessage({
        name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });

      setSuccess(res.message || "Message sent successfully");

      setFormData({
        full_name: "",
        // company: "",
        subject: "",
        email: "",
        phone: "",
        message: "",
      });
      setErrors({}); // Clear errors on success
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen mt-10 bg-gray-50 py-14">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have questions about shipments, pricing, or support? Our team is
            available 24/7 to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.full_name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-600"
                  }`}
                />
              </div>

              {/* <input
                type="text"
                name="company"
                placeholder="Company (optional)"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
              /> */}

              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-600"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.phone
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-600"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <textarea
                name="message"
                placeholder="Your message..."
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />

              {success && (
                <p className="text-green-600 text-sm font-medium">{success}</p>
              )}

              {error && (
                <p className="text-red-600 text-sm font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Get in Touch</h2>

              <InfoItem
                icon={<MapPin className="w-6 h-6" />}
                title="Office Address"
                text="3, Baker Street, Periyamedu, Choolai, Chennai, Tamil Nadu 600003"
              />

              <InfoItem
                icon={<Phone className="w-6 h-6" />}
                title="Phone"
                text="+91 9444032677"
              />

              <InfoItem
                icon={<Mail className="w-6 h-6" />}
                title="Email"
                text="support@martransports.com"
              />

              <InfoItem
                icon={<Clock className="w-6 h-6" />}
                title="Business Hours"
                text="24/7 Support | Office: Mon–Sat 9AM–6PM"
              />
            </div>

            {/* Emergency Card */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-7 h-7" />
                <h3 className="text-xl font-semibold">Urgent Support</h3>
              </div>
              <p className="mb-4 text-red-100">
                Facing a critical shipment issue? Call our emergency helpline.
              </p>
              <a
                href="tel:+919876543210"
                className="inline-block bg-white text-red-600 px-6 py-3 rounded-lg font-semibold"
              >
                +91 9444032677
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Reusable Info Item */
function InfoItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
}