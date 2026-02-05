const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivitySchema = new Schema({
  actorId: { type: String, index: true },
  actorEmail: { type: String },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  resourceId: { type: String, index: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  meta: { type: Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
