import Joi from "joi";

export const createTermsValidation = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  is_published: Joi.boolean().optional(),
  is_message: Joi.boolean().optional(),
});

export const updateTermsValidation = Joi.object({
  title: Joi.string().optional(),
  content: Joi.string().optional(),
  is_published: Joi.boolean().optional()
});

export const updateTermsStatusValidation = Joi.object({
  status: Joi.boolean().required(),
});

export const deleteAllTermsValidation = Joi.object({
  delete_key: Joi.string().required(),
});
