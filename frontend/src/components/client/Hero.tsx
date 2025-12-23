import { Truck, ArrowRight } from "lucide-react";
import heroBg from "../../assets/images/hero.jpg";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 to-blue-700/20" />

      {/* Content wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left content column */}
          <div className="lg:col-span-7 py-24 sm:py-28 lg:py-32 text-white">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-800/70 border border-blue-500 text-sm">
              <Truck className="w-4 h-4 text-yellow-400" />
              <span>Reliable Logistics Solutions</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight">
              Ship Your Goods with <br />
              <span className="text-yellow-400">Speed & Precision</span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-base sm:text-lg text-blue-100 max-w-xl">
              Professional transport services from Ambur, Vaniyambadi, Ranipet, Gudiyatham and
              Pallavaram to Chennai and Bangalore ports and airports. Track your shipment in
              real-time with confidence.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/client/book")}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-6 py-3 rounded-lg transition"
              >
                Book Shipment
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate("/client/track")}
                className="bg-white hover:bg-blue-100 text-blue-900 font-semibold px-6 py-3 rounded-lg transition"
              >
                Track Package
              </button>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-3xl font-bold text-yellow-400">500+</h3>
                <p className="text-blue-100 mt-1">Shipments Monthly</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-yellow-400">24/7</h3>
                <p className="text-blue-100 mt-1">Support Available</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-yellow-400">98%</h3>
                <p className="text-blue-100 mt-1">On-Time Delivery</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
