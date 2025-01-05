import Joi from "joi";

export const createAdsValidation = Joi.object({
  ad_company: Joi.string().required().messages({
    "any.required": "Which company is advertising?",
    "string.empty": "Which company is advertising?",
  }),
  ad_package: Joi.string().required().messages({
    "any.required": "Which is the company going to advertise on?",
    "string.empty": "Which is the company going to advertise on?",
  }),
  start_date: Joi.date().required().messages({
    "any.required": "When will the ad start?",
  }),
  link: Joi.string(),
  is_active: Joi.boolean(),
  img: {
    cloudinary_secure_url: Joi.string().required().messages({
      "any.required": "Secure URl of the uploaded image is required",
      "string.empty": "Secure URl of the uploaded image is required",
    }),
    cloudinary_public_id: Joi.string().required().messages({
      "any.required": "Public Id of the uploaded image is required",
      "string.empty": "Public Id of the uploaded image is required",
    }),
  },
});

export const updateAdsValidator = Joi.object({
  ad_company: Joi.string(),
  ad_package: Joi.string(),
  link: Joi.string(),
});

export const updateAdStatusValidator = Joi.object({
  is_active: Joi.boolean().required(),
});

export const updateImgValidator = Joi.object({
  img: Joi.object()
    .keys({
      cloudinary_secure_url: Joi.string().required(),
      cloudinary_public_id: Joi.string().required(),
    })
    .required(),
});

// Validate the api that updates start date and expire date of ad
export const updateAdCalendarValidator = Joi.object({
  start_date: Joi.date().required(),
  end_date: Joi.date().min(Joi.ref("start_date")).required(),
});

// Delete all ads
export const validateDeleteAllAPI = Joi.object({
  delete_key: Joi.string().required().messages({
    "any.required": "Please provide a valid delete key",
    "string.empty": "Please provide a valid delete key",
  }),
});
