import Joi, { number, string } from "joi";

// Validate the create-app-version api
export const validateCreateAPI = Joi.object({
  latest_version: Joi.string().required(),
  os: Joi.string().required(),
  url: Joi.string().required(),
  highly_severe: Joi.boolean(),
});

// Validate update-api
export const validateUpdateAPI = Joi.object({
  latest_version: Joi.string(),
  os: Joi.string(),
  url: Joi.string(),
});

// Validate delete-api
export const validateDeleteAllAPI = Joi.object({
  delete_key: Joi.string(),
});

// Validate update-severity api
export const validateSeverityAPI = Joi.object({
  highly_severe: Joi.boolean().required(),
});
