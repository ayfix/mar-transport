import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

// 1. Connect to DB
connectDB();

const adminsToCreate = [
  {
    name: 'Admin One',
    email: 'admin1@mar.com',
    password: 'Admin@1',
    phone: '8876543210',
    company: 'MAR HQ',
    role: 'admin'
  },
  {
    name: 'Admin Two',
    email: 'admin2@mar.com',
    password: 'Admin@2',
    phone: '8493216547',
    company: 'MAR Logistics',
    role: 'admin'
  }
];

const importData = async () => {
  try {
    console.log('🌱 Starting Seeder...');

    for (const adminData of adminsToCreate) {
      // Check if this specific admin exists
      const adminExists = await User.findOne({ email: adminData.email });

      if (adminExists) {
        console.log(`⚠️  ${adminData.name} (${adminData.email}) already exists.`);
        continue; // Skip to next admin
      }

      // Create the Admin User
      const newAdmin = new User(adminData);
      await newAdmin.save();
      console.log(`✅ ${adminData.name} created successfully!`);
    }

    console.log('🎉 Seeding Complete!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();