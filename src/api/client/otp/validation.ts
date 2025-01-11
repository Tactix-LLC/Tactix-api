import Joi from "joi";

export const sendOtpValidation = Joi.object({
  first_name: Joi.string().max(100).min(2).required(),
  last_name: Joi.string().max(100).min(2).required(),
  phone_number: Joi.string().max(13).min(10).required(),
  email: Joi.string().email().required(),
  birth_date: Joi.date().required(),
  pin: Joi.string().max(4).min(4).required(),
  pin_confirm: Joi.string().max(4).min(4).required(),
  accept: Joi.boolean().required(),
  agent_code: Joi.string().min(10).max(10),
  ref_agent_code: Joi.string().min(10).max(10),
});

export const verifyOtpValidation = Joi.object({
  phone_number: Joi.string().required(),
  otp: Joi.string().required(),
});
