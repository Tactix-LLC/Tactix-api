import Joi from "joi";

export const createTrasnferHistoryValidation = Joi.object({
  team_id: Joi.string().required(),
  game_week: Joi.string().required(),
  bought_player: {
    full_name: Joi.string().required(),
    club: Joi.string().required(),
    price: Joi.number().required(),
  },
  sold_player: {
    full_name: Joi.string().required(),
    club: Joi.string().required(),
    price: Joi.number().required(),
  },
});

export const deleteAllTranferHistoryValidation = Joi.object({
  deleteKey: Joi.string().required(),
});
