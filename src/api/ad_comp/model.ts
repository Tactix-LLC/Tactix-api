import mongoose, { Schema } from "mongoose";
import IAdCompanyDoc from "./dto";
import validator from "validator";

// Schema for Ad company
const adCompSchema = new Schema(
  {
    comp_name: {
      type: String,
      required: [true, "Company name is required"],
    },
    comp_name_slug: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "Company name slug is required"],
    },
    comp_tin: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      required: [true, "TIN is required"],
    },
    comp_addr: {
      type: String,
      required: [true, "Company address is required"],
    },
    comp_contact: {
      phone_number: [
        {
          type: String,
          required: [true, "Please provide at least one phone number"],
        },
      ],
      email: {
        type: String,
        validate: {
          validator: () => {
            validator.isEmail;
          },
          message: "Invalid email address",
        },
      },
    },
    business_type: {
      type: String,
      required: [true, "Business type is required"],
    },
    website: String,
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

// Ad companies model
const AdCompany = mongoose.model<IAdCompanyDoc>("AdCompany", adCompSchema);

export default AdCompany; // Export the model
