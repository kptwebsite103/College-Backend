const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocalizedString = {
  en: { type: String },
  kn: { type: String },
};

const MenuItemSchema = new Schema({
  title: { type: Object, required: true },
  url: { type: String },
  redirect_url: { type: String },
  order: { type: Number, default: 0 },
  target: { type: String, enum: ['_self', '_blank'], default: '_self' },
  status: { type: String, enum: ['Created', 'Approved'], default: 'Created' },
  items: [{ type: mongoose.Schema.Types.Mixed }] // Allow nested subitems
});

const MenuSchema = new Schema({
  name: { type: Object, required: true },
  slug: { type: String, required: true, index: true, unique: true },
  type: { type: String, enum: ['header', 'footer', 'navigation'], default: 'navigation' },
  url: { type: String },
  redirect_url: { type: String },
  items: [MenuItemSchema],
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  departmentId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Menu', MenuSchema);
