const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  read: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);