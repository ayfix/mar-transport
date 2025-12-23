import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/user/signup
 * Client signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, company } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password, // Mongoose pre-save hook will hash this automatically
      company,
      role: 'client'
    });

    await user.save();
    
    const token = generateToken(user);

    res.status(201).json({
      message: 'Client registered successfully',
      token,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/user/login
 * General login (works for both client and admin)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password)
      return res.status(400).json({ message: 'Provide email and password.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    // password removed by toJSON method in model

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/user/profile
 * Protected route
 */
router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

export default router;