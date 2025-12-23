import express from 'express';
import { getDashboardReports } from '../controllers/reportController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // ✅ Removed curly braces

const router = express.Router();

// GET /api/reports/dashboard
// I also added authMiddleware here so the route is actually protected
router.get('/dashboard', authMiddleware, getDashboardReports);

export default router;