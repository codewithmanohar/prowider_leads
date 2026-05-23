import mongoose from 'mongoose';

const ProviderSchema = new mongoose.Schema({
  providerNumber: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  monthlyQuota: { type: Number, default: 10 },
  leadsReceived: { type: Number, default: 0 },
  leads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }]
});

export default mongoose.models.Provider || mongoose.model('Provider', ProviderSchema);