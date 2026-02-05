const Joi = require('joi');

const localizedString = Joi.object({
  en: Joi.string().allow('').required(),
  kn: Joi.string().allow('').required(),
});

const createSchema = Joi.object({
  title: localizedString.required(),
  slug: Joi.string().required(),
  content: Joi.object({ en: Joi.any(), kn: Joi.any() }).required(),
  departmentId: Joi.string().optional().allow(null, ''),
  tags: Joi.array().items(Joi.string()).optional(),
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
});

module.exports = { createSchema, updateSchema };
