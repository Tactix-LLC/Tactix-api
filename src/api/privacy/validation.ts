import Joi from "joi";

export const createPrivacyValidation = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  is_message: Joi.boolean().optional(),
  is_published: Joi.boolean().optional(),
});

export const updateStatusValidation = Joi.object({
  status: Joi.boolean().required(),
});

export const updatePrivacyValidation = Joi.object({
  title: Joi.string().optional(),
  content: Joi.string().optional(),
});

export const deleteAllPrivaciesValidation = Joi.object({
  delete_key: Joi.string().required(),
});
