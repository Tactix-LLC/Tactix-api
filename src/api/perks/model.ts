import mongoose, { Schema } from "mongoose";
import IPerkDoc from "./dto";

// Perk schema
const perkSchema = new Schema(
  {
    perk_name: {
      type: String,
      unique: true,
      required: [true, "Perk name is required"],
      minlength: [1, "Perk name must contain at least 1 characters"],
      maxlength: [100, "Perk can not contain more than 100 characters"],
    },
    number_of_usage: {
      type: Number,
      required: [true, "number of usage is required"],
      min: [1, "only 1 number of usage is allowed"],
    },
    week_or_year: {
      type: String,
      required: [true, "week or year is required"],
      enum: {
        values: ['W', 'Y'],
      },
    },
    status: {
      type: Boolean,
      required: [true, "status is required"],
      default: true
    }
    
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
const Perk = mongoose.model<IPerkDoc>(
  "Perk",
  perkSchema
);

// Export model
export default Perk;
