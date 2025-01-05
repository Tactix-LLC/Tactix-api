import IGameWeekDoc from "./dto";
import mongoose, { Schema } from "mongoose";

// Game week schema
const gameWeekSchema = new Schema(
  {
    game_week: {
      type: String,
      unique: true,
      requried: [true, "Game week is required"],
      minlength: [1, "Game week must have at least one character"],
      maxlength: [2, "Game week can not have more than 2 characters"],
    },
    sid: {
      type: String,
      required: [true, "Season id is required"],
    },
    cid: {
      type: String,
      required: [true, "Competition id is required"],
    },
    season_id: {
      type: mongoose.Types.ObjectId,
      ref: "Season",
      required: [true, "Season ID is required"],
    },
    competition_id: {
      type: mongoose.Types.ObjectId,
      ref: "Competition",
      required: [true, "Competition ID is required"],
    },
    transfer_deadline: {
      type: Date,
      required: [true, "Transfer Deadline of game week is required"],
    },
    purchase_deadline: {
      type: Date,
      required: [true, "Purchase deadline of the game week is required"],
    },
    is_free: {
      type: Boolean,
      default: false,
    },
    is_done: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    first_match_start_date: {
      type: Date,
      required: [
        true,
        "Start date and time of first match of the game week is required",
      ],
    },
    last_match_end_date: {
      type: Date,
      required: [
        true,
        "End date and time of the last match of the game week is required",
      ],
    },
    match_ids: [String],
    time_interval: Date,
    is_double_gameweek: {
      type: Boolean,
      default: false,
    },
    double_gameweek_first_match: Date,
    double_gameweek_transfer_deadline: Date,
    double_gameweek_teams: [String],
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

// Create model from the schema
const GameWeek = mongoose.model<IGameWeekDoc>("GameWeek", gameWeekSchema);

export default GameWeek; // Export model
