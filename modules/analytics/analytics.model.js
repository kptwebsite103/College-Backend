const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnalyticsSchema = new Schema({
  event: { type: String, required: true, index: true },
  data: { type: Schema.Types.Mixed },
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);