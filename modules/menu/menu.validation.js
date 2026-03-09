const Joi = require('joi');

const LocalizedString = Joi.object({ en: Joi.string().required(), kn: Joi.string().allow('', null) });

const menuItem = Joi.object({
  title: LocalizedString.required(),
  url: Joi.string().optional(),
  redirect_url: Joi.string().optional(),
  icon: Joi.string().optional(),
  order: Joi.number().optional(),
  target: Joi.string().valid('_self', '_blank').optional(),
  status: Joi.string().valid('Created', 'Approved', 'Rejected').optional(),
  items: Joi.array().items(Joi.link('#menuItem')).optional(),
}).id('menuItem'); // Add id for recursive reference

const createSchema = Joi.object({
  name: LocalizedString.required(),
  slug: Joi.string().required(),
  type: Joi.string().valid('header', 'footer', 'navigation').optional(),
  status: Joi.string().valid('Created', 'Approved', 'Rejected').optional(),
  items: Joi.array().items(menuItem).optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
  departmentId: Joi.string().optional(),
  redirect_url: Joi.string().optional(),
});

const updateSchema = Joi.object({
  name: LocalizedString.optional(),
  slug: Joi.string().optional(),
  type: Joi.string().valid('header', 'footer', 'navigation').optional(),
  status: Joi.string().valid('Created', 'Approved', 'Rejected').optional(),
  items: Joi.array().items(menuItem).optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
  departmentId: Joi.string().optional(),
  redirect_url: Joi.string().optional(),
});

module.exports = { createSchema, updateSchema };
