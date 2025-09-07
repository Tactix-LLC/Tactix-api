import Joi from "joi";

export const updateSystemSettingsValidator = Joi.object({
  auto_join_hours_before: Joi.number().min(0).max(24).optional(),
  transfer_deadline_hours_before: Joi.number().min(0).max(24).optional(),
  purchase_deadline_minutes_before: Joi.number().min(0).max(1440).optional(),
  default_timezone: Joi.string().optional(),
  max_group_members: Joi.number().min(2).max(1000).optional(),
  auto_agent_on_registration: Joi.boolean().optional(),
  audit_log_retention_days: Joi.number().min(1).max(3650).optional(),
  rate_limit_per_minute: Joi.number().min(1).max(10000).optional(),
  mongo_pool_size: Joi.number().min(1).max(100).optional(),
  mongo_timeout: Joi.number().min(1000).max(300000).optional(),
  redis_ttl_hours: Joi.number().min(1).max(168).optional(),
  features: Joi.object({
    groups_enabled: Joi.boolean().optional(),
    auto_join_enabled: Joi.boolean().optional(),
    oauth_enabled: Joi.boolean().optional(),
    manual_data_override_enabled: Joi.boolean().optional(),
  }).optional(),
});

export const updatePointSystemValidator = Joi.object({
  // Playing time
  playing_under_60_minutes: Joi.number().min(0).max(10).optional(),
  playing_60_plus_minutes: Joi.number().min(0).max(10).optional(),
  
  // Goals by position
  goalkeeper_goal: Joi.number().min(0).max(50).optional(),
  defender_goal: Joi.number().min(0).max(50).optional(),
  midfielder_goal: Joi.number().min(0).max(50).optional(),
  forward_goal: Joi.number().min(0).max(50).optional(),
  
  // Assists
  assist: Joi.number().min(0).max(20).optional(),
  
  // Clean sheets
  goalkeeper_clean_sheet: Joi.number().min(0).max(20).optional(),
  defender_clean_sheet: Joi.number().min(0).max(20).optional(),
  midfielder_clean_sheet: Joi.number().min(0).max(20).optional(),
  
  // Goalkeeper specific
  saves_per_3: Joi.number().min(0).max(10).optional(),
  penalty_save: Joi.number().min(0).max(50).optional(),
  
  // Defensive contributions
  defender_defensive_contributions: Joi.object({
    threshold: Joi.number().min(1).max(50).optional(),
    points: Joi.number().min(0).max(20).optional(),
  }).optional(),
  midfielder_defensive_contributions: Joi.object({
    threshold: Joi.number().min(1).max(50).optional(),
    points: Joi.number().min(0).max(20).optional(),
  }).optional(),
  forward_defensive_contributions: Joi.object({
    threshold: Joi.number().min(1).max(50).optional(),
    points: Joi.number().min(0).max(20).optional(),
  }).optional(),
  
  // Penalties
  penalty_miss: Joi.number().min(-20).max(0).optional(),
  
  // Cards
  yellow_card: Joi.number().min(-10).max(0).optional(),
  red_card: Joi.number().min(-20).max(0).optional(),
  
  // Other
  own_goal: Joi.number().min(-20).max(0).optional(),
  goals_conceded_per_2: Joi.number().min(-10).max(0).optional(),
  
  // Bonus points
  bonus_points: Joi.object({
    first_place: Joi.number().min(0).max(10).optional(),
    second_place: Joi.number().min(0).max(10).optional(),
    third_place: Joi.number().min(0).max(10).optional(),
  }).optional(),
});
