const mongoose = require('mongoose');
const { Schema } = mongoose;

const BackupSchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  createdBy: { type: String },
  error: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Backup', BackupSchema);