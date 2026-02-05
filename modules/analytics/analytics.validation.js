const Joi = require('joi');

const createSchema = Joi.object({
  event: Joi.string().required(),
  data: Joi.object().optional(),
  userId: Joi.string().optional(),
  sessionId: Joi.string().optional(),
  ip: Joi.string().optional(),
  userAgent: Joi.string().optional(),
});

const listSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(1000).optional(),
  skip: Joi.number().integer().min(0).optional(),
  event: Joi.string().optional(),
  userId: Joi.string().optional(),
  sessionId: Joi.string().optional(),
});

const reportSchema = Joi.object({
  startDate: Joi.string().optional(),
  endDate: Joi.string().optional(),
  userId: Joi.string().optional(),
  groupBy: Joi.string().valid('hour', 'day', 'month').optional(),
});

module.exports = { createSchema, listSchema, reportSchema };