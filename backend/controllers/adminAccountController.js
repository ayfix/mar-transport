// controllers/adminAccountController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

/**
 * @desc    Update admin details (name, email, phone)
 * @route   PUT /api/admin/profile
 * @access  Private/Admin
 */
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: 'Invalid admin id' });
    }

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const { name, email, phone } = req.body;

    if (email && email !== admin.email) {
      // Ensure unique email
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
      admin.email = email;
    }
    if (name !== undefined) admin.name = name;
    if (phone !== undefined) admin.phone = phone;

    await admin.save();
    
    // Do not return password
    const safe = admin.toObject();
    delete safe.password;
    
    res.json({ message: 'Profile updated', admin: safe });
  } catch (err) {
    console.error('Admin profile update error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Change admin password
 * @route   PUT /api/admin/profile/password
 * @access  Private/Admin
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    // We need the password field to compare
    const admin = await User.findById(adminId).select('+password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // 1. Verify old password
    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    if (newPassword.length < 7) {
        return res.status(400).json({ message: 'newPassword must be at least 7 characters' });
    }

    // ✅ FIXED: Assign Plaintext Password directly. 
    // The User model's pre('save') hook will handle the hashing automatically.
    admin.password = newPassword; 
    
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Admin change password error', err);
    res.status(500).json({ message: 'Server error' });
  }
};