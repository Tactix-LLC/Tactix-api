import { ISystemSettings, IPointSystem } from "./model";

export namespace SystemSettingsRequest {
  export interface IUpdateSystemSettings {
    auto_join_hours_before?: number;
    transfer_deadline_hours_before?: number;
    purchase_deadline_minutes_before?: number;
    default_timezone?: string;
    max_group_members?: number;
    auto_agent_on_registration?: boolean;
    audit_log_retention_days?: number;
    rate_limit_per_minute?: number;
    mongo_pool_size?: number;
    mongo_timeout?: number;
    redis_ttl_hours?: number;
    features?: {
      groups_enabled?: boolean;
      auto_join_enabled?: boolean;
      oauth_enabled?: boolean;
      manual_data_override_enabled?: boolean;
    };
  }

  export interface IUpdatePointSystem {
    // Playing time
    playing_under_60_minutes?: number;
    playing_60_plus_minutes?: number;
    
    // Goals by position
    goalkeeper_goal?: number;
    defender_goal?: number;
    midfielder_goal?: number;
    forward_goal?: number;
    
    // Assists
    assist?: number;
    
    // Clean sheets
    goalkeeper_clean_sheet?: number;
    defender_clean_sheet?: number;
    midfielder_clean_sheet?: number;
    
    // Goalkeeper specific
    saves_per_3?: number;
    penalty_save?: number;
    
    // Defensive contributions
    defender_defensive_contributions?: {
      threshold?: number;
      points?: number;
    };
    midfielder_defensive_contributions?: {
      threshold?: number;
      points?: number;
    };
    forward_defensive_contributions?: {
      threshold?: number;
      points?: number;
    };
    
    // Penalties
    penalty_miss?: number;
    
    // Cards
    yellow_card?: number;
    red_card?: number;
    
    // Other
    own_goal?: number;
    goals_conceded_per_2?: number;
    
    // Bonus points
    bonus_points?: {
      first_place?: number;
      second_place?: number;
      third_place?: number;
    };
  }
}

export namespace SystemSettingsResponse {
  export type ISystemSettings = import("./model").ISystemSettings;
  export type IPointSystem = import("./model").IPointSystem;
}