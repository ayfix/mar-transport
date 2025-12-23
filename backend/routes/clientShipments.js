import express from 'express';
import mongoose from 'mongoose';
import Shipment from '../models/Shipment.js';
import authMiddleware from '../middleware/authMiddleware.js';


import {
  getActiveClientShipments,
  getDeliveredClientShipments,
  createShipment,
  trackShipment
} from "../controllers/shipmentController.js";

const router = express.Router();


// ensure role = client for protected client routes
const clientOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') return res.status(403).json({ message: 'Forbidden: client only' });
  next();
};

router.get(
  "/shipments/active",
  authMiddleware,
  clientOnly,
  getActiveClientShipments
);

router.get(
  "/shipments/delivered",
  authMiddleware,
  clientOnly,
  getDeliveredClientShipments
);

router.post('/client/shipments', authMiddleware, createShipment);

// 2. Track Shipment (Public)
// Matches: GET /api/shipments/track/:trackingId
router.get('/client/shipments/track/:trackingId', trackShipment);

/**
 * GET /api/client/shipments
 * List shipments belonging to logged-in client
 * Query params: status, page, limit, search (trackingId/contactName/dispatchID)
 */
router.get('/shipments', authMiddleware, clientOnly, async (req, res) => {
  try {
    const clientId = req.user._id;
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = { client: clientId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { dispatchID: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Shipment.countDocuments(filter);
    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v') // hide mongoose meta
      .lean();

    return res.json({ total, page: Number(page), limit: Number(limit), shipments });
  } catch (err) {
    console.error('Client shipments list error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/client/shipments/:id
 * Get shipment details for the logged-in client (only if they own the shipment)
 */
router.get('/shipments/:id', authMiddleware, clientOnly, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid shipment id' });

    const shipment = await Shipment.findById(id).populate('client', 'name email phone company');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    if (String(shipment.client._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you do not own this shipment' });
    }

    return res.json({ shipment });
  } catch (err) {
    console.error('Client get shipment error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/client/track/:trackingId
 * Public tracking endpoint (returns limited info)
 * Useful if customer pastes tracking id on website (no auth required)
 * Returns: trackingId, status, assignedTruck, timeline (most recent 10), pickup/delivery basic info
 */
router.get('/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    if (!trackingId || typeof trackingId !== 'string') return res.status(400).json({ message: 'trackingId required' });

    const shipment = await Shipment.findOne({ trackingId })
      .select('trackingId status assignedTruck pickupLocation deliveryLocation createdAt timeline contactName dispatchID')
      .lean();

    if (!shipment) return res.status(404).json({ message: 'Tracking ID not found' });

    // return most recent 10 timeline entries (reverse)
    const timeline = (shipment.timeline || []).slice(-10);

    return res.json({
      trackingId: shipment.trackingId,
      status: shipment.status,
      assignedTruck: shipment.assignedTruck || null,
      pickupLocation: shipment.pickupLocation,
      deliveryLocation: shipment.deliveryLocation,
      contactName: shipment.contactName,
      dispatchID: shipment.dispatchID,
      createdAt: shipment.createdAt,
      timeline
    });
  } catch (err) {
    console.error('Public track error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/client/shipments/summary
 * Quick client dashboard counts
 * Returns counts: total, booked, inTransit, delivered, pendingAssignments
 */
router.get('/shipments/summary', authMiddleware, clientOnly, async (req, res) => {
  try {
    const clientId = req.user._id;

    const total = await Shipment.countDocuments({ client: clientId });
    const booked = await Shipment.countDocuments({ client: clientId, status: 'booked' });
    const inTransit = await Shipment.countDocuments({ client: clientId, status: 'in transit' });
    const picked = await Shipment.countDocuments({ client: clientId, status: 'picked up' });
    const delivered = await Shipment.countDocuments({ client: clientId, status: 'delivered' });
    const pendingAssignments = await Shipment.countDocuments({ client: clientId, assignedTruck: null, status: 'booked' });

    return res.json({ total, booked, picked, inTransit, delivered, pendingAssignments });
  } catch (err) {
    console.error('Client shipments summary error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});




export default router;
