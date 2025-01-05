import Joi from "joi";

// Create injuries and bans
export const createInjuriesBansValidation = Joi.object({
  player: Joi.object({
    pid: Joi.string().required().messages({
      "any.required": "Player Id is required",
      "string.empty": "Player Id is required",
    }),
    pname: Joi.string().required().messages({
      "any.required": "Player name is required",
      "string.empty": "Player name is required",
    }),
    role: Joi.string().required().messages({
      "any.required": "Player position is required",
      "string.empty": "Player position is required",
    }),
    rating: Joi.string().required().messages({
      "any.required": "Player rating is required",
      "string.empty": "Player rating is required",
    }),
    team: Joi.object({
      tid: Joi.string().required().messages({
        "any.required": "Team Id is required",
        "string.empty": "Team Id is required",
      }),
      tname: Joi.string().required().messages({
        "any.required": "Team name is required",
        "string.empty": "Team name is required",
      }),
      logo: Joi.string().required().messages({
        "any.required": "Team logo is required",
        "string.empty": "Team logo is required",
      }),
      fullname: Joi.string().required().messages({
        "any.required": "Full name of the team is required",
        "string.empty": "Full name of the team is required",
      }),
      abbr: Joi.string().required().messages({
        "any.required": "Abbreviation of the team name is required",
        "string.empty": "Abbreviation of the team name is required",
      }),
    })
      .required()
      .messages({
        "any.required": "Team detail is required",
      }),
  })
    .required()
    .messages({
      "any.required": "Player detail is required",
    }),
  state: Joi.string()
    .valid("Ban", "Injury", "U/A")
    .required()
    .messages({
      "any.required": "What is the state? Ban, Injury, or Unavailable?",
      "string.empty": "What is the state? Ban, Injury, or Unavailable?",
      "any.only": "State must be either Ban, Injury or Unavailable",
    }),
  injury_title: Joi.string().when("state", {
    is: "Injury",
    then: Joi.string().required().messages({
      "any.required": "Injury title is required",
      "string.empty": "Injury title is required",
    }),
    otherwise: Joi.string().optional(),
  }),
  chance: Joi.number().min(0).required().messages({
    "any.required": "What's the chance of the player coming back?",
    "number.min":
      "Chance of the player coming back can not be less than 0 percent",
  }),
});

// Update injury and ban
export const updateInjuryBanValidation = Joi.object({
  state: Joi.string().optional(),
  injury_title: Joi.string().when("state", {
    is: "Injury",
    then: Joi.string().required().messages({
      "any.required": "Injury title is required",
      "string.empty": "Injury title is required",
    }),
    otherwise: Joi.string().optional(),
  }),
  chance: Joi.number().optional(),
});

// Delete all injuries and bans validation
export const deleteInjuriesBansValidation = Joi.object({
  delete_key: Joi.string().required().messages({
    "any.required": "Please provide a valid delete key",
    "string.empty": "Please provide a valid delete key",
  }),
});
