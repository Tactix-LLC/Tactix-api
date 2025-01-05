import Joi from "joi";

export const createFeedbackTitleValidation = Joi.object({
  title: Joi.string().required(),
});

export const updateFeedbackTitleStatusValidation = Joi.object({
  status: Joi.string().valid("Active", "Inactive").required(),
});

export const deleteAllFeedbackTitlesValidation = Joi.object({
  delete_key: Joi.string().required(),
});
