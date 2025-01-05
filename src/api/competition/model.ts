import mongoose, { Schema } from "mongoose";
import ICompetitionDoc from "./dto";

// Competition schema
const competitionSchema = new Schema(
  {
    competition_name: {
      type: String,
      required: [true, "Competition name is required"],
      minlength: [5, "Competition name must contain at least 5 characters"],
      maxlength: [20, "Competition can not contain more than 20 characters"],
    },
    competition_slug: {
      type: String,
      unique: true,
      required: [true, "Competition slug is required"],
    },
    sid: {
      type: String,
      required: [true, "Season id is required"],
    },
    cid: {
      type: String,
      required: [true, "Competition id is required"],
    },
    logo: String,
    is_active: {
      type: Boolean,
      default: true,
    },
    start_date: {
      type: Date,
      required: [true, "Start date of the competition  is required"],
    },
    end_date: {
      type: Date,
      required: [true, "End date of the competition is required"],
    },
    status: {
      type: Number,
      required: [true, "Competition status is required"],
      enum: {
        values: [1, 2, 3],
        message: "Unknown status selected",
      },
    },
    season: {
      type: mongoose.Types.ObjectId,
      ref: "Season",
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

// Create the model
const Competition = mongoose.model<ICompetitionDoc>(
  "Competition",
  competitionSchema
);

// Export model
export default Competition;
