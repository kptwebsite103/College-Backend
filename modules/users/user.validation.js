const Joi = require('joi');
const { email, password, name, userRoles, departmentId, active } = require('../../validations');

const createSchema = Joi.object({
  username: Joi.string().required(),
  email: email.required(),
  password: password.required(),
  roles: Joi.array().items(Joi.string().valid('user', 'admin', 'super-admin', 'creator')).optional(),
  isActive: active
});

const updateSchema = Joi.object({
  username: Joi.string().optional(),
  email: email.optional(),
  password: password.optional(),
  roles: Joi.array().items(Joi.string().valid('user', 'admin', 'super-admin', 'creator')).optional(),
  isActive: active
});

module.exports = { createSchema, updateSchema };