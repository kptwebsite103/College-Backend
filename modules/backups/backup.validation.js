const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required(),
  path: Joi.string().optional(),
});

const listSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  skip: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('pending', 'running', 'completed', 'failed').optional(),
});

module.exports = { createSchema, listSchema };