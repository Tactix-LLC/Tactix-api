import Joi, { string } from "joi";

// Validate create-user api
export const createTeamValidator = Joi.object({
  competition: Joi.string().required(),
  team_name: Joi.string().min(1).max(50).required(),
  favorite_coach: Joi.string().required(),
  favorite_tactic: Joi.string().required(),
  players: Joi.array()
    .items({
      full_name: Joi.string().required(),
      pid: Joi.string().required(),
      price: Joi.number().required(),
      position: Joi.string()
        .valid("Goalkeeper", "Defender", "Midfielder", "Forward")
        .required(),
      club: Joi.string().required(),
      club_logo: Joi.string(),
      is_bench: Joi.boolean(),
      is_captain: Joi.boolean(),
      is_vice_captain: Joi.boolean(),
      minutesplayed: Joi.number(),
      goalscored: Joi.number(),
      assist: Joi.number(),
      passes: Joi.number(),
      shotsontarget: Joi.number(),
      cleansheet: Joi.number(),
      shotssaved: Joi.number(),
      penaltysaved: Joi.number(),
      tacklesuccessful: Joi.number(),
      yellowcard: Joi.number(),
      redcard: Joi.number(),
      owngoal: Joi.number(),
      goalsconceded: Joi.number(),
      penaltymissed: Joi.number(),
    })
    .required()
    .messages({
      "any.required": "Please select 15 players",
    }),
});

// Validate update-team api
export const updateTeamValidator = Joi.object({
  team_name: Joi.string().min(2).max(50),
  favorite_coach: Joi.string(),
  favorite_tactic: Joi.string(),
  budget: Joi.number().min(0).max(100),
});

// Validate switch-players api
export const validateSwitchPlayers = Joi.object({
  pid: Joi.string().required(),
});

// Validate transfer-player api
export const validateTransferPlayer = Joi.object({
  full_name: Joi.string().required(),
  pid: Joi.string().required(),
  price: Joi.number().min(0).required(),
  position: Joi.string()
    .valid("Goalkeeper", "Defender", "Midfielder", "Forward")
    .required(),
  club: Joi.string().required(),
  club_logo: Joi.string(),
});

// Validate change-captaian-and-vice-captain
export const validateChangeCaptainAPI = Joi.object({
  pid: Joi.string().required(),
});

// Update budget
export const updateBudgetValidation = Joi.object({
  amount: Joi.number().required(),
});

// Update favorite tactic
export const updateFavoriteTacticValidation = Joi.object({
  favorite_tactic: Joi.string().required(),
});

// Update favorite coach
export const updateFavoriteCoachValidation = Joi.object({
  favorite_coach: Joi.string().required(),
});

// Update team profile
export const updateTeamProfileValidation = Joi.object({
  favorite_coach: Joi.string().required(),
  favorite_tactic: Joi.string().required(),
});

// Validate recreate-team API
export const validateRecreateTeam = Joi.object({
  players: Joi.array()
    .items({
      full_name: Joi.string().required(),
      pid: Joi.string().required(),
      price: Joi.number().required(),
      position: Joi.string()
        .valid("Goalkeeper", "Defender", "Midfielder", "Forward")
        .required(),
      club: Joi.string().required(),
      club_logo: Joi.string(),
      is_bench: Joi.boolean(),
      is_captain: Joi.boolean(),
      is_vice_captain: Joi.boolean(),
      minutesplayed: Joi.number(),
      goalscored: Joi.number(),
      assist: Joi.number(),
      passes: Joi.number(),
      shotsontarget: Joi.number(),
      cleansheet: Joi.number(),
      shotssaved: Joi.number(),
      penaltysaved: Joi.number(),
      tacklesuccessful: Joi.number(),
      yellowcard: Joi.number(),
      redcard: Joi.number(),
      owngoal: Joi.number(),
      goalsconceded: Joi.number(),
      penaltymissed: Joi.number(),
    })
    .required()
    .messages({
      "any.required": "Please select 15 new players",
    }),
});
