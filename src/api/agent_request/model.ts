import mongoose from "mongoose";
import IAgentRequestDoc from "./dto";

// Agent Request Schema
const agentRequestSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    facebook_link: {
      type: String,
    },
    tiktok_link: {
      type: String,
    },
    instagram_link: {
      type: String,
    },
    current_job: {
      type: String,
      required: [true, "Current job is required"],
      minlength: [2, "Current job can not be less than 2 characters"],
      maxlength: [100, "Current job can not exceed 100 characters"],
    },
    user_traction: {
      type: Number,
      required: [true, "User traction is required"],
      min: [1, "User traction can not be less than 1"],
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Contacted", "Approved", "Rejected"],
        message: "Unknown or invalid request status",
      },
      default: "Pending",
    },
    cancel_reason: String,
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

// Agent Request model
const AgentRequestModel = mongoose.model<IAgentRequestDoc>(
  "AgentRequest",
  agentRequestSchema
);

// Export Agent Request model
export default AgentRequestModel;
