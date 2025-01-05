import mongoose, { Schema } from "mongoose";
import IInjuriesBanDoc from "./dto";

// Injuries and bans schema
const injuriesBanSchema = new Schema(
  {
    player: {
      pid: {
        type: String,
        required: [true, "Player ID is required"],
      },
      pname: {
        type: String,
        required: [true, "Full name of the player is required"],
      },
      role: {
        type: String,
        required: [true, "Player role is requried"],
      },
      rating: {
        type: String,
        required: [true, "Player rating is required"],
      },
      team: {
        tid: {
          type: String,
          required: ["Team ID is required"],
        },
        tname: {
          type: String,
          required: [true, "Team name is required"],
        },
        logo: {
          type: String,
          required: [true, "Team logo is required"],
        },
        fullname: {
          type: String,
          required: [true, "Team full name is required"],
        },
        abbr: {
          type: String,
          required: [true, "Team abbreviation is required"],
        },
      },
    },
    state: {
      type: String,
      required: [true, "State is requried"],
      enum: {
        values: ["Injury", "Ban","U/A"],
        message: "Unknown state",
      },
    },
    injury_title: {
      type: String,
    },
    chance: {
      type: Number,
      required: [true, "Chance of playing is required"],
      min: [0, "Chance can not be less than zero percent"],
    },
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
    },
    timestamps: true,
  }
);

// Injuries and bans model
const InjuriesBan = mongoose.model<IInjuriesBanDoc>(
  "InjuriesBan",
  injuriesBanSchema
);

// Export model
export default InjuriesBan;
