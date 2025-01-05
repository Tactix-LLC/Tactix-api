import Joi from "joi";

// Validate create api
export const validateCreateAPI = Joi.object({
  cid: Joi.string().required(),
});

// Validate delete-all api
export const validateDeleteAllAPI = Joi.object({
  deleteKey: Joi.string().required(),
});
