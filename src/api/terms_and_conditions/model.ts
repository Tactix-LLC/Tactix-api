import ITermsAndConditionsDoc from "./dto";
import mongoose, { Schema } from "mongoose";

const termsSchema: Schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      min: [1, "Title must contain at least 1 character"],
      maxlength: [100, "Title can not have more than 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      min: [10, "Content must contain at least 10 characters"],
      maxlength: [50000, "Content can not have more than 50000 characters"],
    },
    is_published: {
      type: Boolean,
      default: false,
    },
    is_message: {
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

const TermsAndConditions = mongoose.model<ITermsAndConditionsDoc>(
  "TermsAndConditions",
  termsSchema
);

export default TermsAndConditions;
