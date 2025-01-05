import Joi from "joi";

export const createTransactionValidation = Joi.object({
  transactionType: Joi.string()
    .required()
    .valid(
      "Deposit",
      "Prize-Bank",
      "Prize-Credit",
      "Purchase",
      "Comission-Bank",
      "Comission-Credit"
    ),
  amount: Joi.number().min(0).required(),
});

export const deleteAllGameValidation = Joi.object({
  deleteKey: Joi.string().required(),
});
