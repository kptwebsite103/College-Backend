const Joi = require('joi');

const LocalizedString = Joi.object({ en: Joi.string().required(), kn: Joi.string().allow('', null) });

const createSchema = Joi.object({
  name: LocalizedString.required(),
  slug: Joi.string().required(),
  description: Joi.object().optional(),
  faculty: Joi.array().items(Joi.string()).optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
});

const updateSchema = Joi.object({
  name: LocalizedString.optional(),
  slug: Joi.string().optional(),
  description: Joi.object().optional(),
  faculty: Joi.array().items(Joi.string()).optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
});

module.exports = { createSchema, updateSchema };
