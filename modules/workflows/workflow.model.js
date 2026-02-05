const mongoose = require('mongoose');
const { Schema } = mongoose;

const WorkflowSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  steps: [{ type: Schema.Types.Mixed }],
  active: { type: Boolean, default: true },
  createdBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Workflow', WorkflowSchema);