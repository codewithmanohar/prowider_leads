import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  serviceType: { type: String, required: true, enum: ['Service 1', 'Service 2', 'Service 3'] },
  description: { type: String },
  assignedProviders: [{ type: Number }],
  createdAt: { type: Date, default: Date.now }
});

// ✅ Enforce duplicate rule at DB level
LeadSchema.index({ phone: 1, serviceType: 1 }, { unique: true });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);