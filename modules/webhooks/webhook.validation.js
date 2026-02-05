const Joi = require('joi');

const webhookSchema = Joi.object({
  source: Joi.string().required(),
  event: Joi.string().required(),
  payload: Joi.object().required(),
});

module.exports = { webhookSchema };