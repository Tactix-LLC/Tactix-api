import Joi from "joi";

// Validation for create coach api
export const createCoachValidator = Joi.object({
  coach_name: Joi.string().required(),
  image_public_id: Joi.string().required(),
  image_secure_url: Joi.string().required(),
});

// Validation for update coach info api
export const updateCoachInfoValidator = Joi.object({
  coach_name: Joi.string().required(),
});

// Validation for update coach image api
export const updateCoachImageValidator = Joi.object({
  image_public_id: Joi.string().required(),
  image_secure_url: Joi.string().required(),
});

// Validation for update coach is active status api
export const updateCoachStatusValidator = Joi.object({
  is_active: Joi.boolean().required(),
});

// Validation for swap coaches
export const swapMajorCoachesValidator = Joi.object({
  existingCoachId: Joi.string().required(),
  newMajorCoachId: Joi.string().required(),
});

// Validation for delete all coaches
export const deleteAllCoachsValidator = Joi.object({
  deleteKey: Joi.string().required(),
});
