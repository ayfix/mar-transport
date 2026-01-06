// controllers/userController.js
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new client
 * @route   POST /api/user/signup
 * @access  Public
 */
export const registerUser = async (req, res) => {
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
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/user/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password)
      return res.status(400).json({ message: 'Provide email and password.' });

    // We explicitly select +password because usually it's set to select: false in the model
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    // password removed by toJSON method in model or manually here if needed

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  // req.user is set by the authMiddleware
  res.json({ user: req.user });
};