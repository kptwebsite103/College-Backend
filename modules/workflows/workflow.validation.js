const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  steps: Joi.array().items(Joi.object()).optional(),
  active: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  steps: Joi.array().items(Joi.object()).optional(),
  active: Joi.boolean().optional(),
});

const listSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  skip: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional(),
});

const executeSchema = Joi.object({
  input: Joi.object().optional(),
});

module.exports = { createSchema, updateSchema, listSchema, executeSchema };