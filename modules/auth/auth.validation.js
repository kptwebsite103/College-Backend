const Joi = require('joi');
const { email, username, password, name, pagination } = require('../../validations');

const webhookSchema = Joi.object({
  type: Joi.string().required(),
  data: Joi.object().required(),
});

const listSchema = pagination;

const registerSchema = Joi.object({
  username: username.required(),
  password: password.required(),
  firstName: name.required(),
  lastName: name.required(),
});

const loginSchema = Joi.object({
  username: username.required(),
  email: email.required(),
  password: password.required(),
});

const loginInitiateSchema = Joi.object({
  username: username.required(),
  password: password.required(),
});

const verifyLoginOtpSchema = Joi.object({
  challengeId: Joi.string().min(10).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const resendLoginOtpSchema = Joi.object({
  challengeId: Joi.string().min(10).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  username: username.required(),
});

const resetPasswordSchema = Joi.object({
  username: username.required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  password: password.required(),
});

module.exports = {
  webhookSchema,
  listSchema,
  registerSchema,
  loginSchema,
  loginInitiateSchema,
  verifyLoginOtpSchema,
  resendLoginOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};