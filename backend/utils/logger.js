import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async (req, action, details, targetId = null) => {
  try {
    // If request comes from system (no user), skip or handle differently
    if (!req.user) return; 

    await ActivityLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      action: action.toUpperCase(),
      details,
      targetId,
    });
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
};