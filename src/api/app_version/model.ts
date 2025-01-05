import IAppVersionDoc from "./dto";
import mongoose, { Schema } from "mongoose";

// Schema for the app-update model
const appVersionSchema = new Schema(
  {
    latest_version: {
      type: String,
      required: [true, "Latest version of the appp is required"],
    },
    os: {
      type: String,
      required: [true, "OS is required"],
      enum: {
        values: ["Android", "iOS"],
        message: "Unknown OS selected",
      },
    },
    url: {
      type: String,
      required: [true, "URL is required"],
    },
    highly_severe: {
      type: Boolean,
      default: false,
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

// Partial index
appVersionSchema.index({ version: 1, os: 1 }, { unique: true });

// The app-update model
const AppVersion = mongoose.model<IAppVersionDoc>(
  "AppVersion",
  appVersionSchema
);

// Export the model
export default AppVersion;
