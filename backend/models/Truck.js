import mongoose from 'mongoose';

const TruckSchema = new mongoose.Schema({
  // Visual ID (e.g., "MAR-TRK-001")
  truckId: { 
    type: String, 
    required: true, 
    unique: true, // This creates the NEW correct index
    uppercase: true,
    trim: true
  },
  driverName: { 
    type: String, 
    required: true 
  },
  driverPhone: { 
    type: String, 
    required: true 
  },
  // Stored as string to allow units like "10 tons"
  capacity: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'available', 'maintenance'], 
    default: 'available' 
  },
  currentLocation: { 
    type: String, 
    default: 'Garage' 
  },
  nextMaintenanceDate: { 
    type: Date 
  },
  fuelLevel: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 100 
  },
  trips: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

export default mongoose.model('Truck', TruckSchema);