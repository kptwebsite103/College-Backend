const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocalizedString = {
  en: { type: String },
  kn: { type: String },
};

const DepartmentSchema = new Schema({
  name: { type: Object, required: true },
  slug: { type: String, required: true, index: true, unique: true },
  description: { type: Object },
  faculty: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
