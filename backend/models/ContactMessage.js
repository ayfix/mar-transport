import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['new', 'read', 'replied'], 
    default: 'new' // <--- CRITICAL: MUST BE 'new'
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ContactMessage', ContactMessageSchema);