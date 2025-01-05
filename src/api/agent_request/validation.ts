import Joi, { object } from "joi";

export const createAgentRequestValidation = Joi.object({
  facebook_link: Joi.string(),
  tiktok_link: Joi.string(),
  instagram_link: Joi.string(),
  current_job: Joi.string(),
  user_traction: Joi.number(),
})
  .or("facebook_link", "tiktok_link", "instagram_link")
  .messages({
    "object.missing": "Please provide at least one social media link of yours",
  });

export const updateAgentRequestStatusValidation = Joi.object({
  status: Joi.string()
    .valid("Pending", "Contacted", "Approved", "Rejected")
    .required(),
  cancel_reason: Joi.string().when("status", {
    is: "Rejected",
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
});

// Validate delete_all requests api
export const deleteAllRequestsValidator = Joi.object({
  delete_key: Joi.string().required(),
});

// Update agents credit
export const updateAgentsCreditValidation = Joi.object({
  amount: Joi.number().required(),
});
