import mongoose, { Schema } from "mongoose";
import ICoachDoc from "./dto";

// Coach schema
const coachSchema = new Schema(
  {
    coach_name: {
      type: String,
      required: [true, "Coach name is required"],
      minlength: [2, "Coach name must contain at least 2 characters"],
      maxlength: [100, "Coach name can not contain more than 100 characters"],
    },
    coach_slugify_name: {
      type: String,
      unique: true,
      required: [true, "Coach slugified name is required"],
      minlength: [2, "Coach slugified name must contain at least 2 characters"],
      maxlength: [
        100,
        "Coach slugified name can not contain more than 100 characters",
      ],
    },
    image_public_id: {
      type: String,
      required: [true, "Image public id is required"],
    },
    image_secure_url: {
      type: String,
      required: [true, "Image secure url is required"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_major: {
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
  }
);

// Create the model
const Coach = mongoose.model<ICoachDoc>("Coach", coachSchema);

// Export model
export default Coach;
