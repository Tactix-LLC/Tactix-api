import Joi from "joi";

// Validate the  api that creates poll
export const validateCreateAPI = Joi.object({
  question: Joi.string().required().messages({
    "any.required": "What is the question?",
  }),
  choices: Joi.array()
    .items(
      Joi.object({
        choice: Joi.string().required().messages({
          "any.required": "The question does not have any choice/answer?",
        }),
      })
    )
    .required()
    .messages({
      "any.required": "Add at least one choice",
    }),
  close_date: Joi.date().required().messages({
    "any.required": "When is the close date?",
  }),
});

// Validate the API that updates a poll detail
export const validateUpdateAPI = Joi.object({
  question: Joi.string(),
  choices: Joi.array().items(
    Joi.object({
      choice: Joi.string().required().messages({
        "any.required": "The question does not have any choice/answer?",
      }),
    })
  ),
  close_date: Joi.date(),
});

// Validate the API that updates poll status
export const validateUpdateStatus = Joi.object({
  status: Joi.string().valid("Open", "Closed").required().messages({
    "any.required": "Status is required",
    "any.only": "Status has to be either Open or Closed",
  }),
});

// Validate delete all API
export const validateDeleteAll = Joi.object({
  delete_key: Joi.string().required().messages({
    "any.required": "Please provide a valid delete key",
  }),
});

// Validate API that creates user response to a poll
export const validatePollResponse = Joi.object({
  poll_id: Joi.string().required().messages({
    "any.required": "Select poll",
  }),
  choice_id: Joi.string().required().messages({
    "any.required": "Select your answer",
  }),
});
