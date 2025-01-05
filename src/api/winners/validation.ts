import Joi, { number } from "joi";

// Validate create api
export const createWinnersValidator = Joi.object({
  client_id: Joi.string().required(),
  game_week_id: Joi.string(),
  month: Joi.string(),
  season: Joi.string().required(),
  weekly_monthly_yearly: Joi.string()
    .required()
    .valid("Weekly", "Monthly", "Yearly"),
  prize: Joi.number().min(0).required(),
  total_fantasy_point: Joi.number().min(0),
  is_credit: Joi.boolean(),
});

// Validata update-prize api
export const updatePrizeValidator = Joi.object({
  prize: Joi.number().required(),
});

// Validate the updateIsCreditAPI
export const updateIsCreditValidator = Joi.object({
  is_credit: Joi.boolean().required(),
});
