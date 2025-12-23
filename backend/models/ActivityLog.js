import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true }, // e.g., "DISPATCH"
    targetId: { type: String }, // ID of shipment/truck
    details: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", activityLogSchema);