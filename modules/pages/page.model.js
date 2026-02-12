const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocalizedString = new Schema({
  en: { type: String, default: '' },
  kn: { type: String, default: '' },
}, { _id: false });

const VersionSchema = new Schema({
  title: LocalizedString,
  content: { type: Schema.Types.Mixed },
  updatedAt: Date,
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  note: String,
}, { _id: false });

const PageSchema = new Schema({
  title: LocalizedString,
  slug: { type: String, index: true },
  redirect_url: { type: String, default: '' },
  css: { type: String, default: '' }, // CSS is shared across languages
  content: { 
    en: {
      html: { type: String, default: '' },
      javascript: { type: String, default: '' }
    },
    kn: {
      html: { type: String, default: '' },
      javascript: { type: String, default: '' }
    }
  },
  status: { type: String, enum: ['created', 'pending', 'review', 'approved', 'published', 'archived', 'rejected', 'draft'], default: 'created' },
  departmentId: { type: String, index: true },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  publishedAt: Date,
  scheduledAt: Date,
  versions: [VersionSchema],
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Page', PageSchema);
