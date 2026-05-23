import mongoose from 'mongoose';

const AllocationStateSchema = new mongoose.Schema({
  serviceType: { type: String, required: true, unique: true },
  // tracks which index in the pool to pick next
  currentIndex: { type: Number, default: 0 }
});

export default mongoose.models.AllocationState || 
  mongoose.model('AllocationState', AllocationStateSchema);