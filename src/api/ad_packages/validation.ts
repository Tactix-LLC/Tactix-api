import Joi from "joi";

// Validate the api that's for creating ad package
export const validateCreateAPI = Joi.object({
  pack_name: Joi.string().required().messages({
    "any.required":
      "How will you identify this package if you don't give it a name?",
    "string.empty":
      "How will you identify this package if you don't give it a name?",
  }),
  price: Joi.number().min(0).required().messages({
    "any.required": "Is the package free?",
  }),
  duration: Joi.number().min(0).required().messages({
    "any.required": "Does the package run for forever?",
  }),
});

// Validate the api that's for udpating ad package detail
export const validateUpdateAPI = Joi.object({
  price: Joi.number().min(0),
  duration: Joi.number().min(0),
});

// Validate the api that's for deleting all ad packages
export const validateDeleteAPI = Joi.object({
  delete_key: Joi.string().required().messages({
    "any.required": "Please provide a valid delete key",
    "string.empty": "Please provide a valid delete key",
  }),
});

// Validate the update-status api
export const validateStatusAPI = Joi.object({
  status: Joi.string().valid("Active", "Inactive").required().messages({
    "any.required": "Status is required",
    "any.only": "Status must be either Active or Inactive",
  }),
});
