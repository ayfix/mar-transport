// controllers/contactController.js
import ContactMessage from '../models/ContactMessage.js';
import mongoose from 'mongoose';

/**
 * @desc    Submit a new contact message
 * @route   POST /api/contact
 * @access  Public
 */
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone = '', subject = '', message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'name, email and message are required' });
    }

    const cm = new ContactMessage({ name, email, phone, subject, message });
    await cm.save();

    // Optionally: send admin notification email / push here
    res.status(201).json({ message: 'Your message has been received. We will contact you shortly.' });
  } catch (err) {
    console.error('Contact create error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all contact messages (Admin)
 * @route   GET /api/contact/admin/contacts
 * @access  Private/Admin
 */
export const getAllContacts = async (req, res) => {
  try {
    const { status = 'new', page = 1, limit = 50 } = req.query;
    const filter = {};
    
    // Apply status filter if it's not 'all'
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ContactMessage.countDocuments(filter);
    
    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ total, page: Number(page), limit: Number(limit), messages });
  } catch (err) {
    console.error('Admin contacts list error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Mark a message as read
 * @route   PUT /api/contact/admin/contacts/:id/read
 * @access  Private/Admin
 */
export const markContactAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    msg.status = 'read';
    await msg.save();
    
    res.json({ message: 'Marked as read', msg });
  } catch (err) {
    console.error('Mark contact read error', err);
    res.status(500).json({ message: 'Server error' });
  }
};