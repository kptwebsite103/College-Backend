const Joi = require('joi');

const localizedString = Joi.object({
  en: Joi.string().allow('').required(),
  kn: Joi.string().allow('').required(),
});

const announcementSchema = Joi.object({
  text: localizedString.optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  attachmentUrl: Joi.string().uri().optional().allow('', null),
  attachmentLabel: Joi.string().optional().allow('', null),
}).optional();

const createSchema = Joi.object({
  title: localizedString.required(),
  slug: Joi.string().required(),
  content: Joi.object({ en: Joi.any(), kn: Joi.any() }).required(),
  departmentId: Joi.string().optional().allow(null, ''),
  tags: Joi.array().items(Joi.string()).optional(),
  announcement: announcementSchema,
});

const updateSchema = Joi.object({
  title: localizedString.optional(),
  slug: Joi.string().optional(),
  content: Joi.object({ en: Joi.any(), kn: Joi.any() }).optional(),
  status: Joi.string().valid('draft', 'review', 'published', 'archived').optional(),
  departmentId: Joi.string().optional().allow(null, ''),
  tags: Joi.array().items(Joi.string()).optional(),
  scheduledAt: Joi.date().optional().allow(null),
  note: Joi.string().optional().allow('', null),
  announcement: announcementSchema,
});

module.exports = { createSchema, updateSchema };
