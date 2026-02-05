const Joi = require('joi');

const LocalizedString = Joi.object({
  en: Joi.string().allow('', null),
  kn: Joi.string().allow('', null)
});

const SlideSchema = Joi.object({
  image: Joi.string().optional(),
  title: LocalizedString.optional(),
  description: LocalizedString.optional(),
  link: Joi.string().uri().optional(),
  order: Joi.number().optional(),
});

const createSchema = Joi.object({
  type: Joi.string().valid('banner', 'slider', 'block').required(),
  title: LocalizedString.optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
  departmentId: Joi.string().optional(),

  // Banner fields
  bannerImage: Joi.string().when('type', {
    is: 'banner',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  bannerDescription: LocalizedString.when('type', {
    is: 'banner',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  bannerLink: Joi.string().uri().when('type', {
    is: 'banner',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),

  // Slider fields
  slides: Joi.array().items(SlideSchema).when('type', {
    is: 'slider',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),

  // Block fields
  blockContent: Joi.object({
    en: Joi.any().optional(),
    kn: Joi.any().optional()
  }).when('type', {
    is: 'block',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
});

const updateSchema = Joi.object({
  type: Joi.string().valid('banner', 'slider', 'block').optional(),
  title: LocalizedString.optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
  departmentId: Joi.string().optional(),

  // Banner fields
  bannerImage: Joi.string().optional(),
  bannerDescription: LocalizedString.optional(),
  bannerLink: Joi.string().uri().optional(),

  // Slider fields
  slides: Joi.array().items(SlideSchema).optional(),

  // Block fields
  blockContent: Joi.object({
    en: Joi.any().optional(),
    kn: Joi.any().optional()
  }).optional(),
});

module.exports = { createSchema, updateSchema };