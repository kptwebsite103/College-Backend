const mongoose = require('mongoose');
const { Schema } = mongoose;

const WorkflowInstanceSchema = new Schema({
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  currentStep: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'in_progress', 'approved', 'rejected', 'completed'], default: 'pending' },
  data: { type: Schema.Types.Mixed },
  approvals: [{
    step: { type: Number, required: true },
    userId: { type: String, required: true },
    action: { type: String, enum: ['approve', 'reject'], required: true },
    timestamp: { type: Date, default: Date.now },
    data: { type: Schema.Types.Mixed }
  }],
  history: [{
    action: { type: String, required: true },
    step: { type: Number },
    userId: { type: String },
    timestamp: { type: Date, default: Date.now },
    data: { type: Schema.Types.Mixed }
  }],
  createdBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WorkflowInstance', WorkflowInstanceSchema);