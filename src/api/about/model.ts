import mongoose, { Schema } from "mongoose";
import IAboutUsDoc from "./dto";

const aboutUsSchema: Schema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [10, "Content must have at least 10 characters"],
      maxlength: [5000, "Content must have less than 5000 characters"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    version_title: {
      type: String,
      required: [true, "Version title is required"],
      minlength: [3, "Version title must have at least 3 characters"],
      maxlength: [50, "Version title can not contain 50 characters"],
    },
    version_content: {
      type: String,
      required: [true, "Version content is required"],
      minlength: [3, "Version content must have at least 3 characters"],
      maxlength: [1000, "Version content can not contain 1000 characters"],
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
const AboutUs = mongoose.model<IAboutUsDoc>("AboutUs", aboutUsSchema);

export default AboutUs;
