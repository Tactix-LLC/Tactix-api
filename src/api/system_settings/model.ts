import mongoose, { Document, Schema } from "mongoose";

// Point system interface matching FPL rules
export interface IPointSystem {
  // Playing time
  playing_under_60_minutes: number;
  playing_60_plus_minutes: number;
  
  // Goals by position
  goalkeeper_goal: number;
  defender_goal: number;
  midfielder_goal: number;
  forward_goal: number;
  
  // Assists
  assist: number;
  
  // Clean sheets
  goalkeeper_clean_sheet: number;
  defender_clean_sheet: number;
  midfielder_clean_sheet: number;
  
  // Goalkeeper specific
  saves_per_3: number; // Points for every 3 saves
  penalty_save: number;
  
  // Defensive contributions (NEW for 2025/26)
  defender_defensive_contributions: {
    threshold: number; // 10
    points: number; // 2
  };
  midfielder_defensive_contributions: {
    threshold: number; // 12
    points: number; // 2
  };
  forward_defensive_contributions: {
    threshold: number; // 12
    points: number; // 2
  };
  
  // Penalties
  penalty_miss: number;
  
  // Cards
  yellow_card: number;
  red_card: number;
  
  // Other
  own_goal: number;
  goals_conceded_per_2: number; // Points lost for every 2 goals conceded
  
  // Bonus points
  bonus_points: {
    first_place: number; // 3
    second_place: number; // 2
    third_place: number; // 1
  };
}

// System settings interface
export interface ISystemSettings extends Document {
  // Point system configuration
  point_system: IPointSystem;
  
  // Game week settings
  auto_join_hours_before: number; // Default: 2
  transfer_deadline_hours_before: number; // Default: 2
  purchase_deadline_minutes_before: number; // Default: 5
  
  // Timezone settings
  default_timezone: string; // Default: 'UTC'
  
  // Group settings
  max_group_members: number; // Default: 50
  
  // Agent settings
  auto_agent_on_registration: boolean; // Default: true
  
  // Audit settings
  audit_log_retention_days: number; // Default: 365
  
  // Rate limiting
  rate_limit_per_minute: number; // Default: 100
  
  // MongoDB connection settings
  mongo_pool_size: number; // Default: 10
  mongo_timeout: number; // Default: 30000
  
  // Redis settings
  redis_ttl_hours: number; // Default: 24
  
  // Feature flags
  features: {
    groups_enabled: boolean;
    auto_join_enabled: boolean;
    oauth_enabled: boolean;
    manual_data_override_enabled: boolean;
  };

  // App status / season break
  season_break_enabled: boolean;
  season_break_title: string;
  season_break_message: string;
  
  // Auto-join specific settings
  auto_join: {
    enabled: boolean;
    hours_before_deadline: number;
    max_retry_attempts: number;
    retry_delay_minutes: number;
    notification_enabled: boolean;
  };
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  version: number;
}

// Default FPL-compatible point system
const defaultPointSystem: IPointSystem = {
  // Playing time
  playing_under_60_minutes: 1,
  playing_60_plus_minutes: 2,
  
  // Goals by position
  goalkeeper_goal: 10,
  defender_goal: 6,
  midfielder_goal: 5,
  forward_goal: 4,
  
  // Assists
  assist: 3,
  
  // Clean sheets
  goalkeeper_clean_sheet: 4,
  defender_clean_sheet: 4,
  midfielder_clean_sheet: 1,
  
  // Goalkeeper specific
  saves_per_3: 1, // 1 point for every 3 saves
  penalty_save: 5,
  
  // Defensive contributions (NEW for 2025/26)
  defender_defensive_contributions: {
    threshold: 10,
    points: 2,
  },
  midfielder_defensive_contributions: {
    threshold: 12,
    points: 2,
  },
  forward_defensive_contributions: {
    threshold: 12,
    points: 2,
  },
  
  // Penalties
  penalty_miss: -2,
  
  // Cards
  yellow_card: -1,
  red_card: -3,
  
  // Other
  own_goal: -2,
  goals_conceded_per_2: -1, // -1 point for every 2 goals conceded
  
  // Bonus points
  bonus_points: {
    first_place: 3,
    second_place: 2,
    third_place: 1,
  },
};

// System settings schema
const SystemSettingsSchema = new Schema<ISystemSettings>({
  point_system: {
    type: Schema.Types.Mixed,
    default: defaultPointSystem,
  },
  
  auto_join_hours_before: {
    type: Number,
    default: 0,
  },
  
  transfer_deadline_hours_before: {
    type: Number,
    default: 2,
  },
  
  purchase_deadline_minutes_before: {
    type: Number,
    default: 5,
  },
  
  default_timezone: {
    type: String,
    default: 'UTC',
  },
  
  max_group_members: {
    type: Number,
    default: 50,
  },
  
  auto_agent_on_registration: {
    type: Boolean,
    default: true,
  },
  
  audit_log_retention_days: {
    type: Number,
    default: 365,
  },
  
  rate_limit_per_minute: {
    type: Number,
    default: 100,
  },
  
  mongo_pool_size: {
    type: Number,
    default: 10,
  },
  
  mongo_timeout: {
    type: Number,
    default: 30000,
  },
  
  redis_ttl_hours: {
    type: Number,
    default: 24,
  },
  
  features: {
    groups_enabled: {
      type: Boolean,
      default: false,
    },
    auto_join_enabled: {
      type: Boolean,
      default: false,
    },
    oauth_enabled: {
      type: Boolean,
      default: false,
    },
    manual_data_override_enabled: {
      type: Boolean,
      default: false,
    },
  },

  // App status / season break
  season_break_enabled: {
    type: Boolean,
    default: false,
  },
  season_break_title: {
    type: String,
    default: "Season Break",
  },
  season_break_message: {
    type: String,
    default:
      "The season has ended. We’re preparing the next season now. Please come back when the new season starts.",
  },
  
  auto_join: {
    enabled: {
      type: Boolean,
      default: true,
    },
    hours_before_deadline: {
      type: Number,
      default: 0,
    },
    max_retry_attempts: {
      type: Number,
      default: 3,
    },
    retry_delay_minutes: {
      type: Number,
      default: 5,
    },
    notification_enabled: {
      type: Boolean,
      default: true,
    },
  },
  
  created_at: {
    type: Date,
    default: Date.now,
  },
  
  updated_at: {
    type: Date,
    default: Date.now,
  },
  
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Update the updated_at field before saving
SystemSettingsSchema.pre('save', function(next) {
  this.updated_at = new Date();
  this.version += 1;
  next();
});

// Static methods
SystemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne().sort({ created_at: -1 });
  
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({});
  }
  
  return settings;
};

SystemSettingsSchema.statics.updateSettings = async function(updates: Partial<ISystemSettings>) {
  let settings = await this.findOne().sort({ created_at: -1 });
  
  if (!settings) {
    settings = await this.create({});
  }
  
  // Update fields
  Object.assign(settings, updates);
  
  await settings.save();
  
  // Clear Redis cache
  // TODO: Implement Redis cache clearing
  
  return settings;
};

// Export the model
export default mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
