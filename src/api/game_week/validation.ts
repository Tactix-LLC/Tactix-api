import Joi from "joi";

// Validate create-gameweek api
export const createGameWeekValidator = Joi.object({
  game_week: Joi.string().required(),
  season_id: Joi.string().required(),
  competition_id: Joi.string().required(),
  is_free: Joi.boolean().optional(),
});

// Validate create gameweek manual
export const createGameWeekManualValidation = Joi.object({
  game_week: Joi.string().required(),
  season_id: Joi.string().required(),
  competition_id: Joi.string().required(),
  match_ids: Joi.array().items(Joi.string()).required(),
  first_match_start_date: Joi.date().required(),
  last_match_end_date: Joi.date().required(),
  is_free: Joi.boolean().optional(),
});

// Validate create doublegameweek api
export const createDoubleGameWeekValidator = Joi.object({
  game_week: Joi.string().required(),
  season_id: Joi.string().required(),
  competition_id: Joi.string().required(),
  first_match_start_date: Joi.date().required(),
  last_match_end_date: Joi.date().required(),
  is_double_gameweek: Joi.boolean().required(),
  double_gameweek_first_match: Joi.date().required(),
  double_gameweek_teams: Joi.array().items(Joi.string().required()),
  is_free: Joi.boolean().optional(),
  match_ids: Joi.array().items(Joi.string()).required(),
});

// Validate update-gameweek-deadline api
export const updateGameWeekValidator = Joi.object({
  game_week: Joi.string().required(),
  season_id: Joi.string().required(),
  competition_id: Joi.string().required(),
});

// Validate update to free
export const updateGameWeekToFreeValidator = Joi.object({
  is_free: Joi.boolean().required(),
});

// Validate update to done
export const updateGameWeekToDoneValidator = Joi.object({
  is_done: Joi.boolean().required(),
});

// Validate update-status api
export const updateStatusValidator = Joi.object({
  is_active: Joi.boolean().required(),
});

// Validate delete-all api
export const deleteAllValidator = Joi.object({
  delete_key: Joi.string().required(),
});

// Validate add match ID
export const addMatchIdValidation = Joi.object({
  match_id: Joi.string().required(),
});

// Validate the API that's for updating deadlines
export const validateDeadlinesAPI = Joi.object({
  transfer_deadline: Joi.date().required().messages({
    "any.required": "Transfer deadline is required",
    "date.empty": "Transfer deadline is required",
  }),
  purchase_deadline: Joi.date().required().messages({
    "any.required": "Purchase deadline is required",
    "date.empty": "Purchase deadline is required",
  }),
  first_match_start_date: Joi.date().required().messages({
    "any.required": "First Match start date is required",
    "date.empty": "First match start date is required",
  }),
  last_match_end_date: Joi.date().required().messages({
    "any.required": "Last match end date is required",
    "date.empty": "Last match end date is required",
  }),
  time_interval: Joi.date().optional(),
});
