import Joi from "joi";

export const createSeasonValidation = Joi.object({
  name: Joi.string().required(),
});

export const updateSeasonValidation = Joi.object({
  name: Joi.string().required(),
});

export const updateSeasonStatusValidation = Joi.object({
  is_active: Joi.boolean().required(),
});

export const deleteAllSeasonsValidation = Joi.object({
  delete_key: Joi.string().required(),
});
