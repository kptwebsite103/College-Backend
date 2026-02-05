const Joi = require('joi');

// Validation for media upload
const uploadSchema = Joi.object({
  folder: Joi.string().optional(),
  departmentId: Joi.string().optional(),
  tags: Joi.string().optional().custom((value, helpers) => {
    if (!value) return value;
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return helpers.error('tags must be an array');
      }
      for (const tag of parsed) {
        if (typeof tag !== 'string') {
          return helpers.error('tags must be an array of strings');
        }
      }
      return parsed;
    } catch (e) {
      return helpers.error('tags must be valid JSON');
    }
  }),
});

// Validation for sign request (client direct upload)
const signSchema = Joi.object({
  folder: Joi.string().optional(),
  public_id: Joi.string().optional(),
  eager: Joi.string().optional(), // Could be array or string, but keeping simple
});

module.exports = { uploadSchema, signSchema };