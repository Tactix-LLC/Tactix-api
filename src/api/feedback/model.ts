import mongoose, { Schema } from "mongoose";
import IFeedbackDoc from "./dto";

const feedbackSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      min: [10, "Title must have at least 10 characters"],
      max: [5000, "Title must have less than 5000 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      min: [10, "Content must have at least 10 characters"],
      max: [5000, "Content must have less than 5000 characters"],
    },
    read_status: {
      type: Boolean,
      default: false,
    },
    first_read_by: {
      type: String,
      reqired: [true, "first read by required"],
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
const Feedback = mongoose.model<IFeedbackDoc>("Feedback", feedbackSchema);

export default Feedback;
