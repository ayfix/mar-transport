// backend/routes/adminNotifications.js
import express from 'express';
import Shipment from '../models/Shipment.js';
import ContactMessage from '../models/ContactMessage.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: admin only' });
  next();
};

/**
 * GET /api/admin/notifications
 * Returns:
 *  - pendingShipments: shipments with status 'booked' and assignedTruck null (or others you define)
 *  - messages: recent contact messages with status 'new'
 */
router.get('/admin/notifications', authMiddleware, adminOnly, async (req, res) => {
  try {
    const pendingShipments = await Shipment.find({
      status: 'booked',
      assignedTruck: null
    }).select('trackingId pickupLocation deliveryLocation createdAt contactName contactPhone price').limit(100).sort({ createdAt: 1 });

    const newMessages = await ContactMessage.find({ status: 'new' }).select('name email phone subject message createdAt').limit(100).sort({ createdAt: -1 });

    // optional counts
    const unreadMessagesCount = await ContactMessage.countDocuments({ status: 'new' });
    const pendingShipmentsCount = await Shipment.countDocuments({ status: 'booked', assignedTruck: null });

    res.json({
      pendingShipmentsCount,
      unreadMessagesCount,
      pendingShipments,
      newMessages
    });
  } catch (err) {
    console.error('Admin notifications error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/admin/notifications/clear
 * Deletes all 'new' contact messages (Mark all as read logic)
 */
router.delete('/admin/notifications/clear', authMiddleware, adminOnly, async (req, res) => {
  try {
    // This deletes ALL messages with status 'new'. 
    // If you want to delete ALL messages regardless of status, remove the filter { status: 'new' }
    await ContactMessage.deleteMany({ status: 'new' });
    
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    console.error('Clear notifications error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/admin/notifications/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    // We try to delete from ContactMessage first
    const deletedMsg = await ContactMessage.findByIdAndDelete(id);
    
    // If you also want to clear shipment notifications (which are just read-only alerts from Shipment model),
    // you typically can't "delete" a shipment just to clear a notification.
    // For this example, we assume we are only clearing ContactMessages.
    
    if (!deletedMsg) {
       // If it was a shipment ID, we can't delete the shipment itself.
       // You would need a separate "Notification" model to track read/unread for shipments.
       // For now, let's assume we just return success to update UI.
       return res.json({ message: 'Notification dismissed' }); 
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete notification error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
