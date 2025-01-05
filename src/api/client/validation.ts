import Joi from "joi";

export const loginValidation = Joi.object({
  phone_number: Joi.string().required(),
  pin: Joi.string().required(),
});

export const updateProfileValidation = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  birth_date: Joi.date().required(),
  phone_number: Joi.number().optional(),
});

export const updatePinValidation = Joi.object({
  current_pin: Joi.string().required(),
  pin: Joi.string().required(),
  pin_confirm: Joi.string().required(),
});

export const forgotPinValidation = Joi.object({
  phone_number: Joi.string().required(),
});

export const changeClientStatusValidation = Joi.object({
  status: Joi.boolean().required(),
});

export const changeClientCommisionValidation = Joi.object({
  commission_balance: Joi.number().required(),
  earned_commission: Joi.number().required(),
});

export const verifyPinResetOtpValidation = Joi.object({
  otp: Joi.string().required(),
  phone_number: Joi.string().required(),
});

export const resetPinValidation = Joi.object({
  pin: Joi.string().required(),
  pin_confirm: Joi.string().required(),
  phone_number: Joi.string().required(),
});

export const updateProfilePictureValidation = Joi.object({
  pp_secure_url: Joi.string().required(),
  pp_public_id: Joi.string().required(),
});

export const updateAgentRequestStatusValidation = Joi.object({
  is_agent: Joi.boolean().required(),
});

export const deleteAllClientsValidation = Joi.object({
  delete_key: Joi.string().required(),
});

export const refundClientValidation = Joi.object({
  amount: Joi.number().required(),
});

export const refundPackageValidation = Joi.object({
  gameweeks: Joi.number().required().messages({
    "any.required": "The number of gameweeks to refund is required",
  }),
});

// Validate api that updates client's prize
export const updatePrizeValidation = Joi.object({
  client_id: Joi.string().required().messages({
    "any.required": "Client id is required",
  }),
  earned_prize: Joi.number(),
  prize_balance: Joi.number(),
});

// Send Bulk SMS
export const sendBulkSmsValidation = Joi.object({
  content: Joi.string().required(),
  sms_type: Joi.string().required(),
  game_week: Joi.string().optional(),
  confirmation_phone_number: Joi.string().required(),
});

// Buy Package using Credit
export const buyPackageUsingCreditValidation = Joi.object({
  amount: Joi.number()
    .required()
    .messages({ "any.required": "Amount is required" }),
  gameweeks: Joi.number()
    .required()
    .messages({ "any.required": "Gameweeks is required" }),
});
