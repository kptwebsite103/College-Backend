const Joi = require('joi');

const listSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  skip: Joi.number().integer().min(0).optional(),
  read: Joi.boolean().optional(),
});

module.exports = { listSchema };