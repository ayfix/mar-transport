// routes/admin.js
import express from 'express';
import { loginAdmin, getAdminDashboard } from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: Admin Login
router.post('/login', loginAdmin);

// Route: Admin Dashboard (Protected)
router.get('/dashboard', authMiddleware, getAdminDashboard);

export default router;