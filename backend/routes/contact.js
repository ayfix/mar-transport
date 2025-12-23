// backend/routes/contact.js
import express from 'express';
import ContactMessage from '../models/ContactMessage.js';
import authMiddleware from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: admin only' });
  next();
};

/**
 * POST /api/contact
 * Public contact page endpoint for users
 * Body: { name, email, phone?, subject?, message }
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone = '', subject = '', message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: 'name, email and message are required' });

    const cm = new ContactMessage({ name, email, phone, subject, message });
    await cm.save();

    // Optionally: send admin notification email / push here (not implemented)
    res.status(201).json({ message: 'Your message has been received. We will contact you shortly.' });
  } catch (err) {
    console.error('Contact create error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/admin/contacts
 * Admin: list contact messages
 * Query: status=new|read|all, page, limit
 */
router.get('/admin/contacts', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status = 'new', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ContactMessage.countDocuments(filter);
    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.json({ total, page: Number(page), limit: Number(limit), messages });
  } catch (err) {
    console.error('Admin contacts list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/admin/contacts/:id/read
 * Mark contact message as 'read'
 */
router.put('/admin/contacts/:id/read', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    msg.status = 'read';
    await msg.save();
    res.json({ message: 'Marked as read', msg });
  } catch (err) {
    console.error('Mark contact read error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
