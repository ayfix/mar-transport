import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as shipmentController from '../controllers/shipmentController.js';

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  next();
};

// --- DISPATCH MANAGEMENT ROUTES ---

// 1. Pending Dispatches (Booked Shipments)
router.get('/admin/dispatches/pending', authMiddleware, adminOnly, shipmentController.getPendingDispatches);

// 2. Active Dispatches (Picked Up / In Transit / Out for Delivery)
router.get('/admin/dispatches/active', authMiddleware, adminOnly, shipmentController.getActiveDispatches);

// 3. Assign Fleet
router.put('/admin/shipments/:id/assign', authMiddleware, adminOnly, shipmentController.assignTruckToShipment);

router.delete('/admin/shipments/:id', authMiddleware, adminOnly, shipmentController.deleteShipment);

// 4. Update Status
router.put('/admin/shipments/:id/status', authMiddleware, adminOnly, shipmentController.updateShipmentStatus);

// ... (Your other report routes can stay below) ...

export default router;