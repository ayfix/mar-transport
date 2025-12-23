import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as truckController from '../controllers/truckController.js';

const router = express.Router();

// Middleware to ensure only admins access these routes
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  next();
};

// 1. GET all trucks
router.get('/admin/trucks', authMiddleware, adminOnly, truckController.getAllTrucks);

// 2. CREATE new truck
router.post('/admin/trucks', authMiddleware, adminOnly, truckController.createTruck);

// 3. UPDATE truck by Database ID (_id)
router.put('/admin/trucks/:id', authMiddleware, adminOnly, truckController.updateTruck);

// 4. DELETE truck by Database ID (_id)
router.delete('/admin/trucks/:id', authMiddleware, adminOnly, truckController.deleteTruck);

export default router;