import Joi from "joi";

export const createAboutUsValidation = Joi.object({
  content: Joi.string().required(),
  version_title: Joi.string().required(),
  version_content: Joi.string().required(),
});

export const updateAboutUsStatusValidation = Joi.object({
  is_active: Joi.boolean().required(),
});

export const updateAboutUsValidation = Joi.object({
  content: Joi.string(),
  version_title: Joi.string(),
  version_content: Joi.string(),
});
