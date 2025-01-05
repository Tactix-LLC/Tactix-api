import mongoose, { Schema } from "mongoose";
import IPollResponseDoc from "./dto";

// Schema for the poll_response model
const pollResSchema = new Schema(
  {
    poll_id: {
      type: Schema.ObjectId,
      ref: "Pol",
      required: [true, "Please select poll"],
    },
    user_id: {
      type: Schema.ObjectId,
      ref: "Client",
      required: [true, "Client id is required"],
    },
    choice_id: {
      type: String,
      required: [true, "Choice id is required"],
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

// Model
const PollResponse = mongoose.model<IPollResponseDoc>(
  "PollResponse",
  pollResSchema
);

// Export the model
export default PollResponse;
