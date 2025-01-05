import Joi from "joi";

// Validate the create-note api
export const createNoteValidator = Joi.object({
  note: Joi.string().min(2).max(250).required(),
});

// Validate update-note api
export const updateNoteValidator = Joi.object({
  note: Joi.string().min(2).max(250).required(),
});
