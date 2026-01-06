// controllers/adminController.js
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Admin specific login
 * @route   POST /api/admin/login
 * @access  Public
 */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password)
      return res.status(400).json({ message: 'Provide email and password.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Strict Admin Check
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Not an admin' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);

    res.json({ message: 'Admin login successful', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get Admin Dashboard Stats
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
export const getAdminDashboard = async (req, res) => {
  // Logic preserved from original route
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }

  res.json({
    activeShipments: 10,
    availableTrucks: 6,
    pendingDispatches: 3,
    recentShipments: []
  });
};