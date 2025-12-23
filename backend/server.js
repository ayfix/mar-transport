import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

// Route Imports
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import ShipmentsRoutes from './routes/Adminshipments.js';
import contactRouter from './routes/contact.js';
import adminAccountRouter from './routes/adminAccount.js';
import adminNotificationsRouter from './routes/adminNotifications.js';
import clientAccountRouter from './routes/clientAccount.js';
import clientShipmentsRouter from './routes/clientShipments.js';
import adminTrucksRouter from './routes/adminTruck.js'; // Fixed typo (adminTruck -> adminTrucks)
import publicShipmentsRouter from './routes/publicShipments.js'; // <--- 1. IMPORT THIS
import shipmentRoutes from './routes/clientShipments.js';
import reportRoutes from './routes/reportRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/admin', activityRoutes);
// Auth Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Public Shipment Routes (Fixes the 404)
// This enables: http://localhost:5000/api/shipments/track/...
app.use('/api/shipments', publicShipmentsRouter); // <--- 2. MOUNT THIS
app.use('/api', shipmentRoutes);
// Admin Feature Routes
app.use('/api', adminTrucksRouter);
app.use('/api', ShipmentsRoutes);
app.use('/api/user/contact', contactRouter);
app.use('/api/admin', adminAccountRouter);
app.use('/api', adminNotificationsRouter);
app.use('/api/reports', reportRoutes);
// Client Feature Routes
app.use('/api/client', clientShipmentsRouter);
app.use('/api/client', clientAccountRouter);

// Root
app.get('/', (req, res) => res.send('MAR Transport Backend (ESM)'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));