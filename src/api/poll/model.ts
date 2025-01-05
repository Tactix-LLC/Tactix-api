import mongoose, { Schema } from "mongoose";
import IPolDoc from "./dto";

// Schema for the poll model
const pollSchema = new Schema(
  {
    question: {
      type: String,
      require: [true, "Question is required"],
    },
    choices: [
      {
        choice: {
          type: String,
          required: [true, "Please add at least one choice"],
        },
        selected_by: {
          type: Number,
          default: 0,
        },
      },
    ],
    status: {
      type: String,
      default: "Open",
      enum: {
        values: ["Open", "Closed"],
        message: "Invalid status",
      },
    },
    close_date: {
      type: Date,
      required: [true, "When will the poll end?"],
    },
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
    },
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pol model
const Pol = mongoose.model<IPolDoc>("Pol", pollSchema);

export default Pol; // Export the model
