const mongoose = require('mongoose');
const { Schema } = mongoose;

const MediaSchema = new Schema({
  url: { type: String, required: true },
  public_id: { type: String },
  filename: { type: String },
  format: { type: String },
  size: { type: Number },
  type: { type: String }, // image, pdf, etc.
  tags: [String],
  uploadedBy: { type: String }, // user id
  departmentId: { type: String },
  usageRefs: [{ type: String }],
  localPath: { type: String }, // path to local file in public/uploads/
  status: { type: String, enum: ['local', 'cloud'], default: 'local' }, // status of the file
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
