// routes/contact.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  submitContactMessage, 
  getAllContacts, 
  markContactAsRead 
} from '../controllers/contactController.js';

const router = express.Router();

// Middleware to check for Admin role
// (Ideally, move this to your middleware folder in the future)
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  next();
};

// Route: Public contact form submission
router.post('/', submitContactMessage);

// Route: Admin list contact messages
router.get('/admin/contacts', authMiddleware, adminOnly, getAllContacts);

// Route: Admin mark message as read
router.put('/admin/contacts/:id/read', authMiddleware, adminOnly, markContactAsRead);

export default router;