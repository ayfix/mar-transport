import Shipment from "../models/Shipment.js";
import Truck from '../models/Truck.js';
import { logActivity } from '../utils/logger.js'; // ✅ IMPORT LOGGER

const BASE_PRICES = {
  "leather products": 100,
  "chemicals": 80,
  "groceries": 70,
  "steel items": 200,
  "textiles": 90,
  "furniture": 120,
  "other": 80,
};

const PRIORITY_MULTIPLIER = {
  low: 1,
  medium: 1.3,
  high: 1.7,
};

const COST_PER_KM = 6;
const COST_PER_KG = 0.5;
const COST_PER_UNIT = 2;

const DISTANCE_MATRIX = {
  ambur: {
    "chennai port": 215,
    "chennai airport": 210,
    "bangalore airport": 190,
  },
  vaniyambadi: {
    "chennai port": 220,
    "chennai airport": 215,
    "bangalore airport": 185,
  },
  ranipet: {
    "chennai port": 115,
    "chennai airport": 110,
    "bangalore airport": 260,
  },
  gudiyatham: {
    "chennai port": 245,
    "chennai airport": 240,
    "bangalore airport": 165,
  },
  pallavaram: {
    "chennai port": 25,
    "chennai airport": 5,
    "bangalore airport": 345,
  },
  chennai: {
    "chennai port": 15,
    "chennai airport": 20,
    "bangalore airport": 350,
  },
  bangalore: {
    "chennai port": 345,
    "chennai airport": 340,
    "bangalore airport": 25,
  },
};

/* ---------- MAIN FUNCTION ---------- */

export function calculatePrice({
  pickupLocation,
  deliveryLocation,
  goodsType,
  quantity,
  weight,
  priority,
}) {
  if (
    !pickupLocation ||
    !deliveryLocation ||
    !goodsType ||
    !priority
  ) {
    throw new Error("Missing required fields for price calculation");
  }

  const pickup = pickupLocation.trim().toLowerCase();
  const delivery = deliveryLocation.trim().toLowerCase();
  const goods = goodsType.trim().toLowerCase();
  const pr = priority.trim().toLowerCase();


  const basePrice = BASE_PRICES[goods];
  if (!basePrice) {
    throw new Error(`Invalid goods type: ${goods}`);
  }

  const distance = DISTANCE_MATRIX[pickup]?.[delivery];
  if (!distance) {
    throw new Error(`Invalid route: ${pickup} → ${delivery}`);
  }

  const multiplier = PRIORITY_MULTIPLIER[pr] ?? 1;

  const distanceCost = distance * COST_PER_KM;
  const weightCost = weight * COST_PER_KG;
  const quantityCost = quantity * COST_PER_UNIT;

  const total =
    (basePrice + distanceCost + weightCost + quantityCost) * multiplier;

  return Math.round(total);
}

/* ---------- CREATE SHIPMENT ---------- */
export const createShipment = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ message: 'Client access only' });
    }

    const {
      pickupLocation,
      deliveryLocation,
      goodsType,
      quantity,
      weight,
      priority,
      contactName,
      contactPhone,
      contactEmail,
      pickupAddress,
      specialInstructions,
      description,
    } = req.body;

    const parsedQuantity = Number(quantity);
    const parsedWeight = Number(weight);

    if (
      !pickupLocation ||
      !deliveryLocation ||
      !goodsType ||
      !contactName ||
      !contactPhone ||
      !contactEmail ||
      !pickupAddress
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (parsedQuantity <= 0 || parsedWeight <= 0) {
      return res.status(400).json({
        message: 'Quantity and weight must be positive numbers',
      });
    }

    const price = calculatePrice({
      pickupLocation,
      deliveryLocation,
      goodsType,
      quantity: parsedQuantity,
      weight: parsedWeight,
      priority,
    });


    const shipment = await Shipment.create({
      client: req.user.id, 
      pickupLocation: pickupLocation.toLowerCase(),
      deliveryLocation: deliveryLocation.toLowerCase(),
      goodsType: goodsType.toLowerCase(),
      quantity: parsedQuantity,
      weight: parsedWeight,
      priority,
      price,
      contactName,
      contactPhone,
      contactEmail,
      pickupAddress,
      specialInstructions,
      description,
    });

    // NOTE: Usually clients create shipments, so req.user is a client.
    // If you want to log client actions too, you can, but typically admin logs are for admins.
    // I'll skip logging here to keep the Admin Dashboard clean, but you can uncomment below if needed.
    // await logActivity(req, "BOOKING", `Client booked Shipment #${shipment.trackingId}`, shipment._id);

    return res.status(201).json({
      success: true,
      shipment,
    });
  } catch (err) {
    console.error('Create shipment failed:', err);
    return res.status(500).json({
      message: 'Failed to book shipment',
    });
  }
};



/* ---------- TRACK SHIPMENT ---------- */
export const trackShipment = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const shipment = await Shipment.findOne({ trackingId }).populate(
      "client",
      "name email"
    );

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: "Error tracking shipment" });
  }
};


export const getActiveClientShipments = async (req, res) => {
  try {
    const activeShipments = await Shipment.find({
      client: req.user._id,
      status: {
        $in: ["booked", "picked up", "in transit", "out for delivery"],
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: activeShipments.length,
      data: activeShipments,
    });
  } catch (error) {
    console.error("Active shipments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================
   GET DELIVERED SHIPMENTS (CLIENT)
====================================== */
export const getDeliveredClientShipments = async (req, res) => {
  try {
    const deliveredShipments = await Shipment.find({
      client: req.user._id,
      status: "delivered",
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: deliveredShipments.length,
      data: deliveredShipments,
    });
  } catch (error) {
    console.error("Delivered shipments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ==========================================================================
   ADMIN DISPATCH FUNCTIONS
   ========================================================================== */

/* * GET /api/admin/dispatches/pending */
export const getPendingDispatches = async (req, res) => {
  try {
    const pending = await Shipment.find({
      status: 'booked' 
    })
    .populate('client', 'name phone email company')
    .sort({ createdAt: 1 });

    res.json({ count: pending.length, shipments: pending });
  } catch (err) {
    console.error("Error fetching pending:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* * GET /api/admin/dispatches/active */
export const getActiveDispatches = async (req, res) => {
  try {
    const active = await Shipment.find({
      status: { $in: ['picked up', 'in transit', 'out for delivery'] }
    })
    .populate('client', 'name phone email company')
    .sort({ updatedAt: -1 });

    res.json({ count: active.length, dispatches: active });
  } catch (err) {
    console.error("Error fetching active:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* * PUT /api/admin/shipments/:id/assign */

export const assignTruckToShipment = async (req, res) => {
  try {
    const { truckNumber, driverName, driverPhone, currentLocation } = req.body;
    
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    let truck = await Truck.findOne({ truckId: truckNumber });

    // --- NEW LOGIC START ---
    if (truck) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const maintenanceDate = new Date(truck.nextMaintenanceDate);
      maintenanceDate.setHours(0, 0, 0, 0);

      // 1. If maintenance is TODAY (or passed), auto-update to maintenance and BLOCK
      if (maintenanceDate.getTime() <= today.getTime()) {
        truck.status = 'maintenance';
        await truck.save(); // Persist the status change
        return res.status(400).json({ 
          message: `Cannot assign: Truck ${truckNumber} is currently due for maintenance (Date: ${maintenanceDate.toLocaleDateString()}). Status updated to Maintenance.` 
        });
      }

      // 2. If maintenance is TOMORROW, BLOCK assignment
      if (maintenanceDate.getTime() === tomorrow.getTime()) {
        return res.status(400).json({ 
          message: `Cannot assign: Truck ${truckNumber} is undergoing maintenance tomorrow.` 
        });
      }
      
      // 3. If passed checks, set to active
      truck.status = 'active';
      if(driverName) truck.driverName = driverName; 
      await truck.save();
    }
    // --- NEW LOGIC END ---

    // 2. Update Shipment
    shipment.assignedTruck = { 
      truckNumber: truck ? truck.truckId : truckNumber, 
      driverName: driverName || (truck ? truck.driverName : ''), 
      driverPhone: driverPhone || (truck ? truck.driverPhone : '') 
    };
    
    shipment.status = 'picked up'; 
    
    shipment.timeline.push({ 
      status: 'picked up', 
      timestamp: new Date(), 
      location: currentLocation || shipment.pickupLocation, 
      notes: `Assigned to truck ${truckNumber}` 
    });
    
    await shipment.save();

    // ✅ LOG ACTIVITY: Dispatch
    await logActivity(req, "DISPATCH", `Assigned Truck ${truckNumber} to Shipment #${shipment.trackingId}`, shipment._id);

    res.json({ message: 'Fleet assigned successfully', shipment });
  } catch (err) {
    console.error('Assign fleet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
/* * PUT /api/admin/shipments/:id/status */
export const updateShipmentStatus = async (req, res) => {
  try {
    const { status, location, notes } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    shipment.status = status;
    shipment.timeline.push({ 
      status, 
      timestamp: new Date(), 
      location: location || '', 
      notes: notes || '' 
    });

    // If Delivered, free the truck
    if (status.toLowerCase() === 'delivered' && shipment.assignedTruck?.truckNumber) {
      const truck = await Truck.findOne({ truckId: shipment.assignedTruck.truckNumber });
      if (truck) {
        truck.status = 'available';
        truck.currentLocation = shipment.deliveryLocation;
        truck.trips = (truck.trips || 0) + 1;
        await truck.save();
      }
    }

    await shipment.save();

    // ✅ LOG ACTIVITY: Status Update
    await logActivity(req, "STATUS UPDATE", `Updated Shipment #${shipment.trackingId} to '${status}'`, shipment._id);

    res.json({ message: 'Status updated', shipment });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* * DELETE /api/admin/shipments/:id */
export const deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    // Mark as cancelled instead of removing
    shipment.status = 'cancelled';
    
    // Free up the truck if one was assigned
    if (shipment.assignedTruck?.truckNumber) {
      const truck = await Truck.findOne({ truckId: shipment.assignedTruck.truckNumber });
      if (truck) {
        truck.status = 'available';
        await truck.save();
      }
      shipment.assignedTruck = undefined;
    }

    shipment.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      location: 'Admin Dashboard',
      notes: 'Shipment cancelled by admin'
    });

    await shipment.save();

    // ✅ LOG ACTIVITY: Cancellation
    await logActivity(req, "CANCELLED", `Cancelled Shipment #${shipment.trackingId}`, shipment._id);

    res.json({ message: 'Shipment cancelled successfully', shipment });
  } catch (err) {
    console.error("Delete shipment error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};