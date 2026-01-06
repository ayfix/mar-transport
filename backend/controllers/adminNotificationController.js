// controllers/adminNotificationController.js
import Shipment from '../models/Shipment.js';
import ContactMessage from '../models/ContactMessage.js';

/**
 * @desc    Get admin notifications (Pending Shipments + New Messages)
 * @route   GET /api/admin/notifications/admin/notifications
 * @access  Private/Admin
 */
export const getNotifications = async (req, res) => {
  try {
    // 1. Find shipments that are booked but have no truck assigned
    const pendingShipments = await Shipment.find({
      status: 'booked',
      assignedTruck: null
    })
    .select('trackingId pickupLocation deliveryLocation createdAt contactName contactPhone price')
    .limit(100)
    .sort({ createdAt: 1 });

    // 2. Find messages that are marked as 'new'
    const newMessages = await ContactMessage.find({ status: 'new' })
    .select('name email phone subject message createdAt')
    .limit(100)
    .sort({ createdAt: -1 });

    // 3. Get total counts
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
};

/**
 * @desc    Clear all 'new' contact messages
 * @route   DELETE /api/admin/notifications/admin/notifications/clear
 * @access  Private/Admin
 */
export const clearAllNotifications = async (req, res) => {
  try {
    // Logic preserved: Deletes ALL messages with status 'new'
    await ContactMessage.deleteMany({ status: 'new' });
    
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    console.error('Clear notifications error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Dismiss a single notification
 * @route   DELETE /api/admin/notifications/admin/notifications/:id
 * @access  Private/Admin
 */
export const dismissNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // We try to delete from ContactMessage first
    const deletedMsg = await ContactMessage.findByIdAndDelete(id);
    
    // Logic preserved: 
    // If it wasn't a contact message (e.g. it was a shipment ID), 
    // we return success anyway to update the UI, but we don't delete the shipment.
    if (!deletedMsg) {
       return res.json({ message: 'Notification dismissed' }); 
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete notification error', err);
    res.status(500).json({ message: 'Server error' });
  }
};