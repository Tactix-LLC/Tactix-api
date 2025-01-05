import Joi from "joi";

export const deleteAllPurchasesValidation = Joi.object({
  delete_key: Joi.string().required(),
});
