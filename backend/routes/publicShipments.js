import express from 'express';
import { trackShipment } from '../controllers/shipmentController.js';

const router = express.Router();

// Route: /track/:trackingId
// When mounted at '/api/shipments', full URL is: /api/shipments/track/:trackingId
router.get('/track/:trackingId', trackShipment);

export default router;