import Joi from "joi";

export const createFaqValidation = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
});

export const updateStatusValidation = Joi.object({
  status: Joi.boolean().required(),
});

export const deleteAllFAQValidation = Joi.object({
  delete_key: Joi.string().required(),
});

export const updateFaqValidation = Joi.object({
  title: Joi.string().optional(),
  content: Joi.string().optional(),
});
