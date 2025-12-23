import mongoose from "mongoose";

/* ---------- Timeline Schema ---------- */
const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    location: { type: String },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ---------- Assigned Truck ---------- */
const assignedTruckSchema = new mongoose.Schema(
  {
    truckNumber: String,
    driverName: String,
    driverPhone: String,
  },
  { _id: false }
);

/* ---------- Shipment Schema ---------- */
const shipmentSchema = new mongoose.Schema(
  {
    trackingId: { type: String, unique: true },
    dispatchID: { type: String },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pickupLocation: {
      type: String,
      enum: [
        "ambur",
        "vaniyambadi",
        "ranipet",
        "gudiyatham",
        "pallavaram",
        "chennai",
        "bangalore",
      ],
      required: true,
    },

    deliveryLocation: {
      type: String,
      enum: ["chennai port", "chennai airport", "bangalore airport"],
      required: true,
    },

  goodsType: {
  type: String,
  required: true,
  enum: [
    'leather products',
    'chemicals',
    'groceries',
    'steel items',
    'textiles',
    'furniture',
    'other'
  ],
},

    quantity: { type: Number, required: true },
    weight: { type: Number, required: true },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    price: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "booked",
        "picked up",
        "in transit",
        "out for delivery",
        "delivered",
      ],
      default: "booked",
    },
    assignedTruck: {
  truckNumber: String, // e.g., MAR-001
  driverName: String,
  driverPhone: String
},
status: {
  type: String,
  enum: ['booked', 'picked up', 'in transit', 'out for delivery', 'delivered', 'cancelled'],
  default: 'booked'
},

    contactName: String,
    contactPhone: String,
    contactEmail: String,
    pickupAddress: String,
    specialInstructions: String,
    description: String,

    assignedTruck: assignedTruckSchema,
    timeline: [timelineSchema],
  },
  { timestamps: true }
);

/* ---------- Auto Generators ---------- */
shipmentSchema.pre("save", function (next) {
  if (!this.trackingId) {
    this.trackingId =
      "MAR" + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
  }

  if (!this.dispatchID) {
    this.dispatchID =
      "DISP" + Date.now().toString().slice(-5) + Math.floor(10 + Math.random() * 90);
  }

  if (this.timeline.length === 0) {
    this.timeline.push({
      status: "booked",
      location: this.pickupLocation,
      notes: "Shipment booked",
    });
  }

  
});

export default mongoose.model("Shipment", shipmentSchema);
