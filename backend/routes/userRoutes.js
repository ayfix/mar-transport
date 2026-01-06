// routes/userRoutes.js
import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile 
} from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for Client Signup
router.post('/signup', registerUser);

// Route for Login
router.post('/login', loginUser);

// Route for Profile (Protected)
router.get('/profile', authMiddleware, getUserProfile);

export default router;