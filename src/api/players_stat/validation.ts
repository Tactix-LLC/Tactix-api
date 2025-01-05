import Joi from "joi";

// Create player stat validation
export const createPlayerStatValidation = Joi.object({
  gameweekid: Joi.string().required(),
});

// Validate update-player-stat API
export const validateUpdatePlayerStat = Joi.object({
  pid: Joi.string().required().messages({
    "any.required": "Player id is required",
  }),
  position: Joi.string(),
  fantasy_point: Joi.number(),
  goalscored: Joi.number(),
});
