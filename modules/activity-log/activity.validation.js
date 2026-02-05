const Joi = require('joi');

// For listing activities, validate query params if needed
const listSchema = Joi.object({
  resourceType: Joi.string().optional(),
  resourceId: Joi.string().optional(),
  actorId: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
});

module.exports = { listSchema };