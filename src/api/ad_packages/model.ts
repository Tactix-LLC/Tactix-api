import mongoose, { Schema } from "mongoose";
import IAdPackagesDoc from "./dto";

// Schema for the ad packages model
const adPackageSchema = new Schema(
  {
    pack_name: {
      type: String,
      required: [true, "Package name is required"],
    },
    pack_name_slug: {
      type: String,
      trim: true,
      required: [true, "Slug of the package name is required"],
    },
    price: {
      type: Number,
      required: [true, "Package price is required"],
      min: [0, "Price must be greater than or equal to 0"],
    },
    duration: {
      type: Number,
      required: [true, "Duration of the advertisement package is required"],
      min: [1, "Duration must be at least one day"],
    },
    status: {
      type: String,
      default: "Active",
      enum: {
        values: ["Active", "Inactive"],
        message: "Invalid status type",
      },
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

// AdPackages model
const AdPackages = mongoose.model<IAdPackagesDoc>(
  "AdPackages",
  adPackageSchema
);

export default AdPackages;
