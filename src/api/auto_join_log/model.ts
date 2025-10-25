import mongoose, { Schema } from "mongoose";
import IAutoJoinLogDoc from "./dto";

// Auto Join Log Schema
const autoJoinLogSchema = new Schema(
  {
    game_week_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameWeek",
      required: [true, "Game week ID is required"],
    },
    game_week: {
      type: String,
      required: [true, "Game week number is required"],
    },
    trigger_type: {
      type: String,
      enum: {
        values: ["automatic", "manual"],
        message: "Trigger type must be either automatic or manual",
      },
      required: [true, "Trigger type is required"],
    },
    trigger_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    executed_at: {
      type: Date,
      required: [true, "Execution time is required"],
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ["success", "partial", "failed"],
        message: "Status must be success, partial, or failed",
      },
      required: [true, "Status is required"],
    },
    total_users: {
      type: Number,
      required: [true, "Total users count is required"],
      min: [0, "Total users cannot be less than 0"],
    },
    successful_joins: {
      type: Number,
      required: [true, "Successful joins count is required"],
      min: [0, "Successful joins cannot be less than 0"],
    },
    failed_joins: {
      type: Number,
      required: [true, "Failed joins count is required"],
      min: [0, "Failed joins cannot be less than 0"],
    },
    already_joined: {
      type: Number,
      default: 0,
      min: [0, "Already joined count cannot be less than 0"],
    },
    error_details: [
      {
        user_id: {
          type: String,
          required: false,
        },
        user_name: {
          type: String,
          required: false,
        },
        user_contact: {
          type: String,
          required: false,
        },
        error_message: {
          type: String,
          required: [true, "Error message is required"],
        },
      },
    ],
    execution_time_ms: {
      type: Number,
      required: [true, "Execution time is required"],
      min: [0, "Execution time cannot be less than 0"],
    },
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
    },
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes for faster queries
autoJoinLogSchema.index({ game_week_id: 1 });
autoJoinLogSchema.index({ executed_at: -1 });
autoJoinLogSchema.index({ status: 1 });
autoJoinLogSchema.index({ trigger_type: 1 });

// Auto Join Log model
const AutoJoinLogModel = mongoose.model<IAutoJoinLogDoc>(
  "AutoJoinLog",
  autoJoinLogSchema
);

export default AutoJoinLogModel;

