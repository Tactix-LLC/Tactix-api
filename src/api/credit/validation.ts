import Joi, { string } from "joi";

// Credit top up validation
export const creditTopupValidation = Joi.object({
  amount: Joi.number()
    .min(1)
    .required()
    .messages({ "any.required": "Deposit amount is required" }),
  phone_number: Joi.string(),
  auto_join: Joi.boolean().required().messages({
    "any.required":
      "Please state if the user should automatically be joined to the current active game week",
    "string.empty":
      "Please state if the user should automatically be joined to the current active game week",
  }),
  is_package: Joi.boolean()
    .default(false)
    .messages({ "any.required": "The Is Package flag is required" }),
  gameweeks: Joi.number().when("is_package", {
    is: true,
    then: Joi.number()
      .required()
      .messages({ "any.required": "The number of game weeks is required" }),
    otherwise: Joi.number().optional(),
  }),
});

// Withdrawal validation
export const withdrawalValidation = Joi.object({
  amount: Joi.number().min(1).required(),
  bank_code: Joi.string(),
  account_number: Joi.string(),
  account_name: Joi.string(),
  toBankOrCredit: Joi.string().valid("Bank", "Credit").required(),
  fromPrizeOrCommission: Joi.string().valid("Prize", "Commission").required(),
});

// Transfer credit validation for admin
export const transferCreditAdminValidation = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  amount: Joi.number().min(1).required(),
});

// Transfer credit validation
export const transferCreditValidation = Joi.object({
  to: Joi.string().required(),
  amount: Joi.number().min(1).required(),
});
