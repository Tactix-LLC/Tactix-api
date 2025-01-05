import mongoose, { Schema } from "mongoose";
import IFeedbackTitleDoc from "./dto";

const feedbackTitteSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      min: [10, "Title must have at least 10 characters"],
      max: [5000, "Title must have less than 500 characters"],
    },
    major: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "Active",
      enum: {
        values: ["Active", "Inactive"],
        message: "Invalid Title Status",
      },
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
const FeedbackTitle = mongoose.model<IFeedbackTitleDoc>(
  "FeedbackTitle",
  feedbackTitteSchema
);

export default FeedbackTitle;
