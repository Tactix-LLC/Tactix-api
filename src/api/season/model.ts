import mongoose, { Schema } from "mongoose";
import ISeasonDoc from "./dto";

const seasonSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Season Name is required"],
      minlength: [4, "Season Name must have at least 4 characters"],
      maxlength: [20, "Season Name must have less than 50 characters"],
    },
    season_id: {
      type: String,
      required: [true, "Season Id is required."],
    },
    is_active: {
      type: Boolean,
      default: true,
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

// Virtually fetch competitions under the service
seasonSchema.virtual("competitions", {
  ref: "Competition",
  localField: "_id",
  foreignField: "season",
});

// Create season model
const Season = mongoose.model<ISeasonDoc>("Season", seasonSchema);

export default Season;
