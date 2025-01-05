import IAdsDoc from "./dto";
import mongoose, { Schema, Types } from "mongoose";

// Ad schema
const adSchema = new Schema(
  {
    ad_company: {
      type: Types.ObjectId,
      ref: "AdCompany",
      required: [true, "Company name is required"],
    },
    ad_package: {
      type: Types.ObjectId,
      ref: "AdPackages",
      required: [true, "Ad package is required"],
    },
    start_date: {
      type: Date,
      required: [true, "Start date of the ad is requried"],
    },
    end_date: {
      type: Date,
      required: [true, "End date of the ad is requried"],
    },
    link: String,
    is_active: {
      type: Boolean,
      default: true,
    },
    img: {
      cloudinary_secure_url: {
        type: String,
        reqired: [true, "Cloudinary Ad image url is required"],
      },
      cloudinary_public_id: {
        type: String,
        reqired: [true, "Cloudinary Ad image pulic id is required"],
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

// Model
const AdvertisementModel = mongoose.model<IAdsDoc>("Ads", adSchema);

// Export model
export default AdvertisementModel;
