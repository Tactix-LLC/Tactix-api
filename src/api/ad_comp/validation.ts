import Joi, { string } from "joi";

// Validate the create-api
export const validateCreateAPI = Joi.object({
  comp_name: Joi.string().required().messages({
    "any.required": "Company name is required",
    "string.empty": "Company name is required",
  }),
  comp_tin: Joi.string().required().messages({
    "any.required": "TIN is required",
    "string.empty": "TIN is required",
  }),
  comp_addr: Joi.string().required().messages({
    "any.required": "Address of the company is required",
    "string.empty": "Address of the company is required",
  }),
  comp_contact: Joi.object()
    .keys({
      phone_number: Joi.array().items(
        Joi.string().required().messages({
          "any.required": "Please add at least one contact",
        })
      ),
      email: Joi.string().email(),
    })
    .required()
    .messages({
      "any.required": "Company contact is required",
    }),
  business_type: Joi.string().required().messages({
    "any.required": "Business type is required",
    "string.empty": "Business type is required",
  }),
  website: Joi.string(),
});

// Validate the update-api
export const validateUpdateAPI = Joi.object({
  comp_name: Joi.string(),
  comp_tin: Joi.string(),
  comp_addr: Joi.string(),
  comp_contact: Joi.object().keys({
    phone_number: Joi.array().items(Joi.string()),
    email: Joi.string().email(),
  }),
  business_type: Joi.string(),
  website: Joi.string(),
});

// Validate delete-all-api
export const validateDeleteAll = Joi.object({
  delete_key: Joi.string().required().messages({
    "any.required": "Delete key is required",
    "string.empty": "Delete key is required",
  }),
});
