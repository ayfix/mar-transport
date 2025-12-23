import { useState , useRef , useEffect } from "react";
import Navbar from "../../components/client/Navbar";
import Hero from "../../components/client/Hero";
import BookShipment from "./BookShipment";
import CEO from "../../assets/images/profile-ceo.jpeg"
import {
  Package,
  MapPin,
  Clock,
  Shield,
  Truck,
  BarChart3,
} from "lucide-react";
import {  ArrowRight } from "lucide-react";

const routes = [
  "Ambur",
  "Vaniyambadi",
  "Ranipet",
  "Gudiyatham",
  "Pallavaram",
  "Chennai",
  "Bangalore",
];

const goods = [
  "Leather Products",
  "Chemicals",
  "Groceries",
  "Steel Items",
  "Textiles",
  "Furniture",
  "General Cargo",
];


const features = [
  {
    title: "Easy Booking",
    description:
      "Book your shipment online in minutes with our intuitive booking system. Select pickup location, goods type, and destination.",
    icon: Package,
  },
  {
    title: "Real-Time Tracking",
    description:
      "Track your shipment with live status updates from pickup to final delivery at Chennai or Bangalore ports.",
    icon: MapPin,
  },
  {
    title: "Timely Delivery",
    description:
      "98% on-time delivery rate with optimized routes and professional drivers ensuring your goods arrive as scheduled.",
    icon: Clock,
  },
  {
    title: "Secure Transport",
    description:
      "Your goods are protected with comprehensive insurance coverage and secure handling throughout the journey.",
    icon: Shield,
  },
  {
    title: "Multiple Locations",
    description:
      "Service coverage across Ambur, Vaniyambadi, Ranipet, Gudiyatham, and Pallavaram with dedicated pickup points.",
    icon: Truck,
  },
  {
    title: "Digital Dashboard",
    description:
      "Access your complete shipment history, analytics, and reports through our comprehensive dashboard.",
    icon: BarChart3,
  },
];

export default function () {
 

    const sectionRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-ceo");
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);


  return (
    <div className="min-h-screen w-full overflow-x-hidden">


      <Hero />
      {/* Cards */}
       <section className="bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Why Choose MAR Transports?
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            Comprehensive logistics solutions designed for efficiency,
            reliability, and peace of mind.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200
                transform transition-all duration-300
                hover:scale-105 hover:-translate-y-2 hover:shadow-xl"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
{/* routes and service */}
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Service Coverage & Goods
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            Wide network coverage with specialized handling for various cargo types.
          </p>
        </div>

        {/* Content */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* LEFT: Service Routes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <MapPin className="text-white w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Service Routes
              </h3>
            </div>

            <div className="space-y-4">
              {routes.map((place) => (
                <div
                  key={place}
                  className="bg-slate-50 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{place}</p>
                    <p className="text-sm text-slate-500">Pickup Location</p>
                  </div>

                  <ArrowRight className="text-orange-400 w-5 h-5" />

                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      Chennai Port & Airport / Bangalore Airport
                    </p>
                    <p className="text-sm text-slate-500">Drop-off Points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Goods We Handle */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <MapPin className="text-white w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Goods We Handle
              </h3>
            </div>

            <div className="space-y-4">
              {goods.map((item) => (
                <div
                  key={item}
                  className="bg-slate-50 rounded-xl px-5 py-4 flex items-center gap-3"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <p className="font-medium text-slate-800">{item}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-slate-500">
              <span className="font-semibold">Note:</span> All goods are handled with care and appropriate safety measures.
              Special handling available for hazardous materials.
            </p>
          </div>

        </div>
      </div>
    </section>

     <section className="bg-slate-50 md:py-20 overflow-hidden">
      <div
        ref={sectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 opacity-0 translate-y-12 transition-all duration-700"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* CEO Image */}
          <div className="relative">
            <div className="absolute -inset-2 bg-blue-600 rounded-2xl opacity-20 blur-xl" />
            <img
              src={CEO}
              alt="CEO of MAR Transports"
              className="relative w-80 max-w-md mx-auto rounded-2xl shadow-xl object-cover"
            />
          </div>

          {/* CEO Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Message from Our CEO
            </h2>

            <p className="mt-6 text-slate-600 text-lg leading-relaxed">
              At <span className="font-semibold text-blue-600">MAR Transports</span>,
              our mission is to deliver logistics solutions that combine reliability,
              transparency, and operational excellence. We believe in building
              long-term partnerships by ensuring every shipment is handled with
              precision and care.
            </p>

            <p className="mt-4 text-slate-600 text-lg leading-relaxed">
              With a strong presence across Tamil Nadu and seamless connectivity
              to Chennai and Bangalore ports, we continue to invest in technology,
              skilled professionals, and optimized routes to support our clients’
              growing logistics needs.
            </p>

            {/* CEO Name */}
            <div className="mt-8">
              <p className="text-xl font-bold text-slate-900">
                Mr. S.M. Jameel Ahmed
              </p>
              <p className="text-sm text-slate-500">
                Founder & Chief Executive Officer
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Animation helper */}
      <style>
        {`
          .animate-ceo {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
        `}
      </style>
    </section>
     <footer className="bg-blue-800 mt-10 md:mt-30 lg:mt-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex flex-col  items-center justify-between text-center sm:text-left gap-3">
          
          <p className="text-sm text-white font-medium">
            © 2024 MAR Transports. All rights reserved.
          </p>

          <p className="text-sm text-blue-100">
            Professional logistics services across Tamil Nadu and Karnataka
          </p>

        </div>
      </div>
    </footer>
    </div>
  );
}
