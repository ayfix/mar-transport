import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/admin/logs
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    // Return last 20 logs, newest first
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;