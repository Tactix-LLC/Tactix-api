import Joi, { boolean } from "joi";

// Create new package validation
export const createNewPackageValidation = Joi.object({
  price: Joi.number().min(0).required(),
  game_weeks: Joi.number().min(2).max(38).required(),
  discount: Joi.number().min(0).required(),
});

// Update package status validation
export const updatePackageStatusValidation = Joi.object({
  is_active: Joi.boolean().required(),
});

// Delete all packages validation
export const deleteAllPackagesValidation = Joi.object({
  delete_key: Joi.string().required(),
});
