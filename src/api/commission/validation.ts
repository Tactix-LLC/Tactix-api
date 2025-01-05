import Joi from "joi";

// Validate create-api
export const createCommissionValidator = Joi.object({
  agent_id: Joi.string().required(),
  amount: Joi.number().required(),
});
