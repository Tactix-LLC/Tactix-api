import Joi, { string } from "joi";

// Update status validation
export const updateRoasterValidation = Joi.object({
  is_active: Joi.boolean().required(),
});

// Update player rating
export const updatePlayerRatingValidaton = Joi.object({
  pid: Joi.string().required(),
  rating: Joi.number().required(),
});

// Delete all roasters
export const deleteAllRoastersValidation = Joi.object({
  delete_key: Joi.string().required(),
});

// Update transfer radar
export const updateTransferRadarValidation = Joi.object({
  transfer_radar: Joi.boolean().required(),
  pid: Joi.string().required(),
});

// Remove a player
export const removePlayerValidation = Joi.object({
  pid: Joi.string().required(),
});

// Add a Player
export const addPlayerValidation = Joi.object({
  pid: Joi.string().required(),
  pname: Joi.string().required(),
  role: Joi.string().required(),
  rating: Joi.string().required(),
  tid: Joi.string().required(),
  tname: Joi.string().required(),
  logo: Joi.string().required(),
  fullname: Joi.string().required(),
  abbr: Joi.string().required(),
});

// Update player team
export const updatePlayerTeamValidation = Joi.object({
  pid: Joi.string().required(),
  team: Joi.object({
    tid: Joi.string().required(),
    tname: Joi.string().required(),
    logo: Joi.string().required(),
    fullname: Joi.string().required(),
    abbr: Joi.string().required(),
  }).required(),
});
