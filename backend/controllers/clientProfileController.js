import User from "../models/User.js";

/* ============================
   GET CLIENT PROFILE
============================ */
export const getClientProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get client profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   UPDATE CLIENT PROFILE
============================ */
export const updateClientProfile = async (req, res) => {
  try {
    const { name, phone, company, address } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Client not found" });
    }

    user.name = name ?? user.name;
    user.phone = phone ?? user.phone;
    user.company = company ?? user.company;
    user.address = address ?? user.address;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update client profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   CHANGE PASSWORD (NO CURRENT)
============================ */
export const changeClientPassword = async (req, res) => {
  try {
    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Client not found" });
    }

    user.password = new_password;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
