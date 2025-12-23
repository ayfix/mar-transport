import React, { useState, useMemo } from "react";
import {
  Package,
  MapPin,
  Truck,
  Phone,
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  XCircle,
  AlertCircle,
  ChevronDown,
  Search,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
// RESTORED: Real API Import
import { trackShipment } from "../../api/shipmentsApi";

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

interface TimelineEvent {
  status: string;
  timestamp: string;
  location: string;
  description?: string;
}

interface TruckDetails {
  truckNumber: string;
  driverName: string;
  driverPhone: string;
  driverRating?: number;
}

interface ShipmentData {
  trackingId: string;
  status: "booked" | "picked up" | "in transit" | "out for delivery" | "delivered" | "cancelled";
  goodsType: string;
  pickupLocation: string;
  deliveryLocation: string;
  timeline: TimelineEvent[];
  assignedTruck?: TruckDetails;
  cancellationReason?: string; // Optional: field for cancellation reason
}

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================

const STATUS_STEPS = [
  "booked",
  "picked up",
  "in transit",
  "out for delivery",
  "delivered",
];

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 50 },
  },
};

const lineVariants: Variants = {
  hidden: { height: 0 },
  visible: { 
    height: "100%",
    transition: { duration: 0.8, ease: "easeInOut" } 
  }
};
// ============================================================================
// 3. SUB-COMPONENTS
// ============================================================================

const InfoItem = ({ icon: Icon, label, value, colorClass = "text-slate-900" }: any) => (
  <div className="flex items-start gap-3 group">
    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-blue-50 group-hover:text-green-600 transition-colors duration-300">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className={`font-semibold text-sm sm:text-base capitalize ${colorClass}`}>{value}</p>
    </div>
  </div>
);

// ============================================================================
// 4. MAIN COMPONENT
// ============================================================================

export default function TrackShipment() {
  // --- STATE ---
  const [trackingId, setTrackingId] = useState("");
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- HANDLERS ---
  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    
    setLoading(true);
    setError("");
    setShipment(null); // Clear previous results

    try {
      // REAL API CALL
      const data = await trackShipment(trackingId);
      setShipment(data);
    } catch (err) {
      console.error(err);
      setError("Shipment not found. Please check the ID.");
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  // --- COMPUTED LOGIC ---

  /**
   * Determine the index where the shipment currently stands.
   * Logic: 
   * - If Cancelled: Find the last "valid" step in the timeline array that matches our steps list.
   * - If Normal: Just match status string to index.
   */
  const currentStatusIndex = useMemo(() => {
    if (!shipment) return -1;
    
    if (shipment.status.toLowerCase() === "cancelled") {
      // Find the last known standard step in the timeline before cancellation
      const lastStandardStep = [...shipment.timeline]
        .reverse()
        .find(t => STATUS_STEPS.includes(t.status.toLowerCase()));
        
      if (lastStandardStep) {
        return STATUS_STEPS.indexOf(lastStandardStep.status.toLowerCase());
      }
      return 0; // Fallback to first step
    }

    return STATUS_STEPS.indexOf(shipment.status.toLowerCase());
  }, [shipment]);

  const isCancelled = shipment?.status.toLowerCase() === "cancelled";

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* HEADER SECTION */}
        <div className="text-center sm:text-left space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2"
          >
            <ShieldAlert className="w-4 h-4" /> Logistics Portal
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Track Your Shipment
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Enter your unique tracking ID to view real-time progress, driver details, and delivery estimates.
          </p>
        </div>

        {/* SEARCH BAR SECTION */}
        <div className="bg-white shadow-xl shadow-slate-200/60 border border-slate-100 rounded-3xl p-3 sm:p-5 flex flex-col sm:flex-row gap-3 relative z-20">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              className="block w-full h-14 pl-12 pr-4 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg font-medium"
              placeholder="Enter Tracking ID"
            />
          </div>
          <button
            onClick={handleTrack}
            disabled={loading}
            className="h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Locating...
              </span>
            ) : (
              <>Track <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </div>

        {/* ERROR STATE */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        {/* RESULTS SECTION */}
        <AnimatePresence mode="wait">
          {shipment && (
            <motion.div
              key="result"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              className="space-y-8"
            >
              {/* A. SHIPMENT SUMMARY CARD */}
              <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                  <Package className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Shipment ID</span>
                      <div className="h-px w-8 bg-slate-200" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                      {shipment.trackingId}
                    </h2>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-5 py-2.5 rounded-full border flex items-center gap-3 shadow-sm ${
                    isCancelled 
                      ? "bg-red-50 border-red-100 text-red-700" 
                      : "bg-emerald-50 border-emerald-100 text-emerald-700"
                  }`}>
                    {isCancelled ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <div className="relative flex h-3 w-3">
                        {shipment.status.toLowerCase() !== 'delivered' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </div>
                    )}
                    <span className="font-bold uppercase tracking-wide text-sm">
                      {shipment.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-12 pt-8 border-t border-slate-100 relative z-10">
                  <InfoItem icon={Package} label="Contents" value={shipment.goodsType} />
                  <InfoItem icon={MapPin} label="Origin" value={shipment.pickupLocation} />
                  <InfoItem icon={MapPin} label="Destination" value={shipment.deliveryLocation} />
                </div>
              </motion.div>

              {/* B. MAIN CONTENT GRID (Timeline + Driver) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- TIMELINE COLUMN --- */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    Tracking History
                  </h3>

                  {/* TIMELINE CONTAINER */}
                  <div className="relative pl-4 sm:pl-6 pb-2">
                    
                    {STATUS_STEPS.map((step, index) => {
                      // 1. DETERMINE STATE OF THIS STEP
                      const timelineEntry = shipment.timeline.find(t => t.status.toLowerCase() === step);
                      
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const isFuture = index > currentStatusIndex;

                      // 2. STYLING LOGIC
                      let iconBg = "bg-white border-slate-200 text-slate-300"; // Future default
                      let textColor = "text-slate-400"; // Future default
                      let borderColor = "border-slate-300";

                      if (isCompleted && !isFuture) {
                         // Past or Current Success
                         iconBg = "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200";
                         textColor = "text-emerald-900";
                         borderColor = "border-emerald-600";
                      }

                      // SPECIAL HANDLING FOR CANCELLED STATE
                      // If cancelled, the 'current' step (where it stopped) turns red
                      if (isCancelled && isCurrent) {
                        iconBg = "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200 ring-4 ring-red-50";
                        textColor = "text-red-700";
                        borderColor = "border-red-600";
                      } 
                      // If cancelled, future steps are greyed out
                      else if (isCancelled && isFuture) {
                         iconBg = "bg-slate-50 border-slate-200 text-slate-300 opacity-50";
                         textColor = "text-slate-300 line-through decoration-slate-300/50";
                      }
                      // Normal Current State
                      else if (isCurrent && !isCancelled) {
                        iconBg = "bg-white border-green-600 text-green-600 ring-4 ring-green-50";
                        textColor = "text-green-700";
                        borderColor = "border-green-600";
                      }

                      // 3. LINE CONNECTING LOGIC
                      // We decide if the line *leaving* this step needs to be colored
                      const isLastStep = index === STATUS_STEPS.length - 1;
                      
                      // Should the line leaving this node be Green? 
                      // (If this step is done, and next step is not future, and NOT cancelled flow)
                      const isGreenLine = !isCancelled && index < currentStatusIndex;
                      
                      // Should the line leaving this node be Red?
                      // (If we are cancelled, and this node is >= the failure node)
                      // This ensures the red line flows continuously from the failure point to the bottom
                      const isRedLine = isCancelled && index >= currentStatusIndex;

                      return (
                        <div key={step} className="relative z-10 flex gap-6 pb-12 last:pb-0 group">
                          
                          {/* VERTICAL CONNECTING LINE */}
                          {!isLastStep && (
                             <div className="absolute left-[20px] sm:left-[24px] top-12 bottom-0 w-0.5 -ml-px z-0">
                                {/* Base Dashed Line (Always visible underneath) */}
                                <div className="absolute inset-0 border-l-2 border-slate-200 border-dashed h-full opacity-60" />
                                
                                {/* Animated Green Line (Success) */}
                                {isGreenLine && (
                                  <motion.div 
                                    variants={lineVariants}
                                    className="absolute top-0 left-[-2px] w-[3px] bg-emerald-500 rounded-b-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                  />
                                )}

                                {/* Animated Red Line (Failure Path) */}
                                {/* Logic: Drawn through the 'future/skipped' nodes to connect to the cancel footer */}
                                {isRedLine && (
                                  <motion.div 
                                    variants={lineVariants}
                                    className="absolute top-0 left-[-2px] w-[3px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                  />
                                )}
                             </div>
                          )}

                          {/* Extra Red Line Extension for the Last Step if Cancelled 
                              (Connects the last standard step to the Cancelled Footer) */}
                          {isLastStep && isCancelled && (
                             <div className="absolute left-[20px] sm:left-[24px] top-12 h-16 w-0.5 -ml-px z-0">
                                 <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: "100%" }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    className="absolute top-0 left-[-2px] w-[3px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                  />
                             </div>
                          )}

                          {/* STEP ICON */}
                          <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${iconBg}`}>
                             {/* Icon Selection */}
                             {isCancelled && isCurrent ? (
                               <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                             ) : isCompleted && !isCurrent ? (
                               <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                             ) : step === 'delivered' && isCurrent ? (
                               <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                             ) : isCurrent ? (
                               <Circle className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> // Pulsing dot for active
                             ) : (
                               <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                             )}
                          </div>

                          {/* TEXT CONTENT */}
                          <div className="pt-1 sm:pt-2 flex-1">
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                <div>
                                   <p className={`text-base sm:text-lg font-bold capitalize transition-colors ${textColor}`}>
                                     {step}
                                   </p>
                                  
                                </div>
                                {timelineEntry?.timestamp && (
                                  <div className="text-left sm:text-right">
                                    <p className="text-sm font-semibold text-slate-700">
                                      {new Date(timelineEntry.timestamp).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono">
                                      {new Date(timelineEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                )}
                             </div>
                             
                             {/* Context description for active step */}
                             {!timelineEntry && isCurrent && !isCancelled && (
                               <p className="text-xs text-blue-500 mt-2 font-medium animate-pulse">
                                 Processing...
                               </p>
                             )}
                          </div>
                        </div>
                      );
                    })}

                    {/* --- SPECIAL CANCELLED FOOTER NODE --- */}
                    {isCancelled && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="relative z-10 flex gap-6 pt-6" // Padding top separates it from the list
                      >
                         {/* Cancelled Icon */}
                         <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 border-4 border-white ring-2 ring-red-500 flex items-center justify-center shrink-0 shadow-xl">
                            <XCircle className="w-6 h-6 text-red-600" />
                         </div>

                         {/* Cancelled Details */}
                         <div className="pt-1 sm:pt-2 w-full">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 w-full">
                              <h4 className="text-red-800 font-bold text-lg flex items-center gap-2">
                                Shipment Cancelled
                              </h4>
                              <p className="text-red-600 text-sm mt-1">
                                {shipment.cancellationReason || "The delivery was stopped due to an unforeseen issue."}
                              </p>
                              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-800 bg-white/50 w-fit px-3 py-1 rounded-lg">
                                <Clock className="w-3 h-3" />
                                {new Date().toLocaleDateString()}
                              </div>
                            </div>
                         </div>
                      </motion.div>
                    )}

                  </div>
                </motion.div>

                {/* --- DRIVER / VEHICLE COLUMN --- */}
                <motion.div variants={itemVariants} className="space-y-6">
                  {shipment.assignedTruck ? (
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                      {/* Artistic Background Circles */}
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Logistics Partner
                          </h3>
                          
                          
                        </div>

                        <div className="space-y-6">
                          {/* Truck Plate */}
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-xs text-slate-400 mb-1">Vehicle Registration</p>
                            <p className="text-2xl font-mono font-bold tracking-tight text-white">
                              {shipment.assignedTruck.truckNumber}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg border-2 border-slate-800">
                              {shipment.assignedTruck.driverName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Driver</p>
                              <p className="font-bold text-lg">{shipment.assignedTruck.driverName}</p>
                              <div className="flex gap-1 mt-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <div key={s} className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                             <a
                               href={`tel:${shipment.assignedTruck.driverPhone}`}
                               className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-semibold shadow-lg shadow-blue-900/20 group-hover:scale-[1.02]"
                             >
                               <Phone className="w-4 h-4" /> Call Driver
                             </a>
                             <p className="text-center text-[10px] text-slate-500 mt-3">
                               Standard carrier rates may apply.
                             </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Empty State for Driver
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                         <Truck className="w-8 h-8 text-slate-300" />
                      </div>
                      <h4 className="text-slate-900 font-bold mb-1">Fleet Not Assigned</h4>
                      <p className="text-sm text-slate-500">
                        Driver details will appear here once the shipment is dispatched from the facility.
                      </p>
                    </div>
                  )}

                  {/* Help Card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                     <h4 className="font-bold text-slate-900 mb-2">Need Assistance?</h4>
                     <p className="text-sm text-slate-500 mb-4">
                       If you have issues with your delivery, our support team is available 24/7.
                     </p>
                     <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                       Contact Support <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                     </button>
                  </div>
                </motion.div>
                {/* C. DRIVER CARD */}
            {/* <div className="space-y-6">
              {shipment.assignedTruck ? (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                   
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Transport Details
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <p className="text-xs text-slate-400">Vehicle Number</p>
                      <p className="text-xl font-mono font-bold">
                        {shipment.assignedTruck.truckNumber}
                      </p>
                    </div>
                    <div className="h-px bg-slate-700/50" />
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 border border-slate-600">
                        {shipment.assignedTruck.driverName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Driver</p>
                        <p className="font-semibold">
                          {shipment.assignedTruck.driverName}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${shipment.assignedTruck.driverPhone}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium backdrop-blur-sm"
                    >
                      <Phone className="w-4 h-4" />{" "}
                      {shipment.assignedTruck.driverPhone}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    Fleet Not Assigned Yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Details will appear here once dispatched.
                  </p>
                </div>
              )}
            </div> */}
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EMPTY STATE / INITIAL LOAD */}
        {!shipment && !loading && (
          <div className="text-center py-20 opacity-40">
            <Package className="w-24 h-24 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 font-medium">Ready to track your package</p>
          </div>
        )}
      </div>
    </div>
  );
}