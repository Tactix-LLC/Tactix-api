import mongoose, { Schema } from "mongoose";
import IPackagesDoc from "./dto";

// Packages Schema
const packagesSchema = new Schema(
  {
    price: {
      type: Number,
      min: [0, "Price can not be less than 0"],
      required: [true, "Price is required"],
    },
    game_weeks: {
      type: Number,
      min: [2, "Number of game weeks can not be less than 2 game weeks"],
      max: [38, "Number of game weeks can not exceed 38 game weeks"],
      required: [true, "Number of game weeks is required"],
      unique: true,
    },
    total_amount: {
      type: Number,
      required: [true, "Total amount of the package before discount"],
      min: [0, "Total amount can not be less than 0"],
    },
    discount: {
      type: Number,
      required: [true, "Discount is required"],
      min: [0, "Discount can not be less than 0"],
    },
    discounted_total_amount: {
      type: Number,
      required: [true, "Discounted total amount is required"],
      min: [0, "Discounted total amount can not be less than 0"],
    },
    is_active: {
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
  }
);

// Packages model
const Packages = mongoose.model<IPackagesDoc>("Package", packagesSchema);

// Export model
export default Packages;
