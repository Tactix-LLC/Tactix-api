import mongoose, { Schema } from "mongoose";
import IFaqDoc from "./dto";

const faqSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
      maxlength: [100, "title can not exceed 100 characters"],
      minlength: [1, "title can not be less than 1 character"],
    },
    content: {
      type: String,
      required: [true, "content is required"],
      maxlength: [5000, "content can not exceed 100 characters"],
      minlength: [1, "content can not be less than 1 character"],
    },
    is_published: {
      type: Boolean,
      default: true,
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

const Faq = mongoose.model<IFaqDoc>("Faq", faqSchema);

export default Faq;
