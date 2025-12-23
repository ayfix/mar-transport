import Truck from '../models/Truck.js';
import { logActivity } from '../utils/logger.js'; // ✅ IMPORT LOGGER

/* * GET /api/admin/trucks */
export const getAllTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find().sort({ createdAt: -1 });
    
    const formattedTrucks = trucks.map(t => ({
      _id: t._id, 
      id: t.truckId,
      driver: t.driverName,
      phone: t.driverPhone,
      capacity: t.capacity,
      status: t.status,
      location: t.currentLocation,
      nextMaintenance: t.nextMaintenanceDate ? t.nextMaintenanceDate.toISOString().split('T')[0] : '',
      fuel: t.fuelLevel,
      trips: t.trips
    }));

    res.json({ count: trucks.length, trucks: formattedTrucks });
  } catch (err) {
    console.error("Error fetching trucks:", err);
    res.status(500).json({ message: 'Server error fetching trucks' });
  }
};

/* * POST /api/admin/trucks */
export const createTruck = async (req, res) => {
  try {
    const { truckNumber, driverName, driverPhone, capacity, status, currentLocation, nextMaintenanceDate, fuelLevel, trips } = req.body;

    const existingTruck = await Truck.findOne({ truckId: truckNumber });
    if (existingTruck) {
      return res.status(400).json({ message: `Truck ID ${truckNumber} already exists.` });
    }

    const newTruck = new Truck({
      truckId: truckNumber,
      driverName: driverName,
      driverPhone: driverPhone,
      capacity,
      status: status || 'available',
      currentLocation: currentLocation || 'Garage',
      nextMaintenanceDate: nextMaintenanceDate || null,
      fuelLevel: fuelLevel !== undefined ? Number(fuelLevel) : 50,
      trips: Number(trips) || 0
    });

    await newTruck.save();
    
    // ✅ LOG ACTIVITY: New Truck
    await logActivity(req, "FLEET UPDATE", `Added new truck ${truckNumber}`, newTruck._id);
    
    const formattedTruck = {
      _id: newTruck._id,
      id: newTruck.truckId,
      driver: newTruck.driverName,
      phone: newTruck.driverPhone,
      capacity: newTruck.capacity,
      status: newTruck.status,
      location: newTruck.currentLocation,
      nextMaintenance: newTruck.nextMaintenanceDate ? newTruck.nextMaintenanceDate.toISOString().split('T')[0] : '',
      fuel: newTruck.fuelLevel,
      trips: newTruck.trips
    };

    res.status(201).json({ message: 'Truck added successfully', truck: formattedTruck });
  } catch (err) {
    console.error("Error creating truck:", err);
    if (err.code === 11000) {
        return res.status(400).json({ message: 'Truck ID already exists (Database Error).' });
    }
    res.status(500).json({ message: 'Server error creating truck' });
  }
};

/* * PUT /api/admin/trucks/:id */
export const updateTruck = async (req, res) => {
  try {
    const { id } = req.params; 
    const { driverName, driverPhone, capacity, status, currentLocation, nextMaintenanceDate, fuelLevel, trips } = req.body;

    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Update fields
    if (driverName) truck.driverName = driverName;
    if (driverPhone) truck.driverPhone = driverPhone;
    if (capacity) truck.capacity = capacity;
    if (status) truck.status = status;
    if (currentLocation) truck.currentLocation = currentLocation;
    if (nextMaintenanceDate !== undefined) truck.nextMaintenanceDate = nextMaintenanceDate;
    if (fuelLevel !== undefined) truck.fuelLevel = Number(fuelLevel);
    if (trips !== undefined) truck.trips = Number(trips);

    await truck.save();

    // ✅ LOG ACTIVITY: Update Truck
    await logActivity(req, "FLEET UPDATE", `Updated details for truck ${truck.truckId}`, truck._id);

    const formattedTruck = {
      _id: truck._id,
      id: truck.truckId,
      driver: truck.driverName,
      phone: truck.driverPhone,
      capacity: truck.capacity,
      status: truck.status,
      location: truck.currentLocation,
      nextMaintenance: truck.nextMaintenanceDate ? truck.nextMaintenanceDate.toISOString().split('T')[0] : '',
      fuel: truck.fuelLevel,
      trips: truck.trips
    };

    res.json({ message: 'Truck updated successfully', truck: formattedTruck });
  } catch (err) {
    console.error("Error updating truck:", err);
    res.status(500).json({ message: 'Server error updating truck' });
  }
};

/* * DELETE /api/admin/trucks/:id */
export const deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTruck = await Truck.findByIdAndDelete(id);

    if (!deletedTruck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // ✅ LOG ACTIVITY: Delete Truck
    // Note: We use the deleted truck ID, even though the object is gone, for reference.
    await logActivity(req, "FLEET UPDATE", `Deleted truck ${deletedTruck.truckId}`, id);

    res.json({ message: 'Truck deleted successfully', id });
  } catch (err) {
    console.error("Error deleting truck:", err);
    res.status(500).json({ message: 'Server error deleting truck' });
  }
};