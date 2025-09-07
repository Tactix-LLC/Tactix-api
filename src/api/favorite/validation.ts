import Joi from "joi";

export const createFavoriteValidation = Joi.object({
  playerId: Joi.string().required(),
  player_name: Joi.string().required(),
  position: Joi.string().required(),
  team: Joi.string().required(),
  player_number: Joi.string().required(),
  club_logo: Joi.string().required(),
});
