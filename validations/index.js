const Joi = require('joi');

// Basic field schemas
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);
const email = Joi.string().email();
const username = Joi.string().alphanum().min(3).max(50);
const password = Joi.string().min(6);
const name = Joi.string().min(1);
const slug = Joi.string().min(1);

// Localized string schemas
const localizedString = Joi.object({
  en: Joi.string().required(),
  kn: Joi.string().allow('', null)
});

const localizedStringRequired = Joi.object({
  en: Joi.string().required(),
  kn: Joi.string().required()
});

// Status schemas
const pageStatus = Joi.string().valid('draft', 'review', 'published', 'archived');

// Role schemas
const userRoles = Joi.array().items(Joi.string().valid('user', 'admin', 'super-admin', 'creator', 'moderator', 'faculty'));

// Pagination schema
const pagination = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  skip: Joi.number().integer().min(0).optional(),
});

// Common optional fields
const active = Joi.boolean().optional();
const order = Joi.number().optional();
const tags = Joi.array().items(Joi.string()).optional();
const departmentId = Joi.string().optional().allow(null, '');
const scheduledAt = Joi.date().optional().allow(null);
const note = Joi.string().optional().allow('', null);

module.exports = {
  objectId,
  email,
  password,
  name,
  slug,
  username,
  localizedString,
  localizedStringRequired,
  pageStatus,
  userRoles,
  pagination,
  active,
  order,
  tags,
  departmentId,
  scheduledAt,
  note
};