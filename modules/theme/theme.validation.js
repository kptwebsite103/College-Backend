const Joi = require('joi');

const createSchema = Joi.object({
  type: Joi.string().required(),
  colors: Joi.object({
    color1: Joi.string().required(),
    color2: Joi.string().required()
  }).required(),
  active: Joi.boolean().optional()
});

const updateSchema = Joi.object({
  type: Joi.string().optional(),
  colors: Joi.object({
    color1: Joi.string().optional(),
    color2: Joi.string().optional()
  }).optional(),
  active: Joi.boolean().optional()
});

module.exports = { createSchema, updateSchema };