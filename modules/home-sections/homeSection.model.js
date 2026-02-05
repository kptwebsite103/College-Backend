const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocalizedString = new Schema({
  en: { type: String, default: '' },
  kn: { type: String, default: '' },
}, { _id: false });

const SlideSchema = new Schema({
  image: { type: String }, // URL or media ID
  title: LocalizedString,
  description: LocalizedString,
  link: { type: String },
  order: { type: Number, default: 0 },
}, { _id: false });

const HomeSectionSchema = new Schema({
  type: { type: String, enum: ['banner', 'slider', 'block'], required: true },
  title: LocalizedString,
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  departmentId: { type: String, index: true },

  // Banner specific
  bannerImage: { type: String }, // For banner type
  bannerDescription: LocalizedString,
  bannerLink: { type: String },

  // Slider specific
  slides: [SlideSchema], // For slider type

  // Block specific
  blockContent: { en: Schema.Types.Mixed, kn: Schema.Types.Mixed }, // Flexible content for blocks

}, { timestamps: true });

module.exports = mongoose.model('HomeSection', HomeSectionSchema);