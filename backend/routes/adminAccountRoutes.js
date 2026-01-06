// routes/adminAccount.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  updateAdminProfile, 
  changeAdminPassword 
} from '../controllers/adminAccountController.js';

const router = express.Router();

// Middleware: Admin Only Check
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  next();
};

// Route: Update Profile
router.put('/profile', authMiddleware, adminOnly, updateAdminProfile);

// Route: Change Password
router.put('/profile/password', authMiddleware, adminOnly, changeAdminPassword);

export default router;