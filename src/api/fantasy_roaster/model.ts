import mongoose, { Schema } from "mongoose";
import IFantasyRoasterDoc from "./dto";

// Fantasy Roaster Schema
const fantasyRoasterSchema = new Schema(
  {
    season_name: {
      type: String,
      required: [true, "Season name is required"],
      unique: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    players: [
      {
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
        prev_rating: {
          type: Number,
        },
        transfer_radar: {
          type: Boolean,
          default: false,
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
        is_new: {
          type: Boolean,
          default: true,
        },
        is_injuried: {
          type: Boolean,
          default: false,
        },
        is_banned: {
          type: Boolean,
          default: false,
        },
      },
    ],
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

// Fantasy Roaster Model
const FantasyRoaster = mongoose.model<IFantasyRoasterDoc>(
  "FantasyRoaster",
  fantasyRoasterSchema
);

// Export model
export default FantasyRoaster;
