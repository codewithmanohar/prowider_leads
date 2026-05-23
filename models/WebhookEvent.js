import mongoose from 'mongoose';

const WebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now }
});

export default mongoose.models.WebhookEvent || 
  mongoose.model('WebhookEvent', WebhookEventSchema);