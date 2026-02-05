const mongoose = require('mongoose');
const { Schema } = mongoose;

const WebhookSchema = new Schema({
  source: { type: String, required: true, index: true }, // e.g., 'payment', 'cms'
  event: { type: String, required: true }, // e.g., 'payment.succeeded', 'content.updated'
  payload: { type: Schema.Types.Mixed, required: true },
  headers: { type: Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
  processedAt: { type: Date },
  error: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Webhook', WebhookSchema);