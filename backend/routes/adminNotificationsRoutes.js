// routes/adminNotifications.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  getNotifications, 
  clearAllNotifications, 
  dismissNotification 
} from '../controllers/adminNotificationController.js';

const router = express.Router();

// Middleware: Admin Only Check
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  next();
};

// Route: Get all notifications
router.get('/admin/notifications', authMiddleware, adminOnly, getNotifications);

// Route: Clear all notifications
router.delete('/admin/notifications/clear', authMiddleware, adminOnly, clearAllNotifications);

// Route: Dismiss single notification
router.delete('/admin/notifications/:id', authMiddleware, adminOnly, dismissNotification);

export default router;