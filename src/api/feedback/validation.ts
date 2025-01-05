import Joi, { string } from "joi";

export const createFeedbackValidation = Joi.object({
  title_id: Joi.string().required(),
  content: Joi.string().required(),
});

export const updateFeedbackStatusValidation = Joi.object({
  content: Joi.optional(),
});

export const deleteAllFeedbacksValidation = Joi.object({
  delete_key: Joi.string().required(),
});
