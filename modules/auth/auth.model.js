const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClerkWebhookSchema = new Schema({
  eventType: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ClerkWebhook', ClerkWebhookSchema);