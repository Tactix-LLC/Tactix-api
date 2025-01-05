import Joi from "joi";

// Validation for create-competition api
export const createCompetitionValidator = Joi.object({
  cid: Joi.string().required(),
  season: Joi.string().required(),
});

// Validation for update-competition api
export const updateCompetitionValidator = Joi.object({
  cid: Joi.string().required(),
});

// Validation for update-status api
export const updateCompetitionStatusValidator = Joi.object({
  is_active: Joi.boolean().required(),
});

// Validation for delete-all-competitions
export const deleteAllComeptitionsValidator = Joi.object({
  delete_key: Joi.string().required(),
});
