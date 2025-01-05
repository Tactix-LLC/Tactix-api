import Joi from "joi";

// Validation for create perk api
export const createPerkValidator = Joi.object({
    perk_name: Joi.string().required(),
    number_of_usage: Joi.number().required(),
    week_or_year: Joi.string().required()
});

// Validation for update perk api
export const updatePerkValidator = Joi.object({
    perk_name: Joi.string().optional(),
    number_of_usage: Joi.number().optional(),
    week_or_year: Joi.string().optional()
});

// Validation for update perk status api
export const updatePerkStatusValidator = Joi.object({
  status: Joi.boolean().required(),
});

// Validation for delete all perks
export const deleteAllPerksValidator = Joi.object({
  deleteKey: Joi.string().required(),
});
