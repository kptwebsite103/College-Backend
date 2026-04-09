const Joi = require("joi");

const LocalizedString = Joi.object({
  en: Joi.string().allow("", null),
  kn: Joi.string().allow("", null),
});

const LinkSchema = Joi.alternatives()
  .try(Joi.string().uri(), Joi.string().pattern(/^\/[^\s]*$/))
  .allow("", null);

const SlideSchema = Joi.object({
  image: Joi.string().allow("", null).optional(),
  title: LocalizedString.optional(),
  description: LocalizedString.optional(),
  link: LinkSchema.optional(),
  order: Joi.number().optional(),
});

const createSchema = Joi.object({
  type: Joi.string()
    .valid("banner", "slider", "gallery", "block", "hero_text", "page_content")
    .required(),
  title: LocalizedString.optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
  departmentId: Joi.string().optional(),

  // Hero text fields
  heroHeading: LocalizedString.when("type", {
    is: "hero_text",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  heroDescription: LocalizedString.when("type", {
    is: "hero_text",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  heroHeadingSize: Joi.number().min(18).max(120).when("type", {
    is: "hero_text",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  heroTextAlign: Joi.string().valid("left", "center", "right").when("type", {
    is: "hero_text",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),

  // Banner fields
  bannerImage: Joi.string().when("type", {
    is: "banner",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  bannerDescription: LocalizedString.when("type", {
    is: "banner",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  bannerLink: LinkSchema.when("type", {
    is: "banner",
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),

  // Slider fields
  slides: Joi.array().items(SlideSchema).when("type", {
    is: Joi.valid("slider", "gallery"),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  // Block/Gallery fields
  blockContent: Joi.object({
    en: Joi.any().optional(),
    kn: Joi.any().optional(),
  }).when("type", {
    switch: [
      { is: "block", then: Joi.required() },
      { is: "gallery", then: Joi.optional() },
    ],
    otherwise: Joi.forbidden(),
  }),

  // Page Content fields
  pageSlug: Joi.string().when("type", {
    is: "page_content",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

const updateSchema = Joi.object({
  type: Joi.string()
    .valid("banner", "slider", "gallery", "block", "hero_text", "page_content")
    .optional(),
  title: LocalizedString.optional(),
  active: Joi.boolean().optional(),
  order: Joi.number().optional(),
  departmentId: Joi.string().optional(),

  // Hero text fields
  heroHeading: LocalizedString.optional(),
  heroDescription: LocalizedString.optional(),
  heroHeadingSize: Joi.number().min(18).max(120).optional(),
  heroTextAlign: Joi.string().valid("left", "center", "right").optional(),

  // Banner fields
  bannerImage: Joi.string().optional(),
  bannerDescription: LocalizedString.optional(),
  bannerLink: LinkSchema.optional(),

  // Slider fields
  slides: Joi.array().items(SlideSchema).optional(),

  // Block fields
  blockContent: Joi.object({
    en: Joi.any().optional(),
    kn: Joi.any().optional(),
  }).optional(),

  // Page Content fields
  pageSlug: Joi.string().allow("", null).optional(),
});

module.exports = { createSchema, updateSchema };
