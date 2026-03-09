const Joi = require("joi");

const createSchema = Joi.object({
  type: Joi.string().required(),
  colors: Joi.object({
    color1: Joi.string().optional(),
    color2: Joi.string().optional(),
  }).optional(),
  contact: Joi.object({
    address: Joi.string().allow("").optional(),
    phone: Joi.string().allow("").optional(),
    email: Joi.string().allow("").optional(),
    description: Joi.string().allow("").optional(),
  }).optional(),
  active: Joi.boolean().optional(),
}).options({ allowUnknown: true });

const updateSchema = Joi.object({
  type: Joi.string().optional(),
  colors: Joi.object({
    color1: Joi.string().optional(),
    color2: Joi.string().optional(),
  }).optional(),
  contact: Joi.object({
    address: Joi.string().allow("").optional(),
    phone: Joi.string().allow("").optional(),
    email: Joi.string().allow("").optional(),
    description: Joi.string().allow("").optional(),
  }).optional(),
  active: Joi.boolean().optional(),
}).options({ allowUnknown: true });

module.exports = { createSchema, updateSchema };
