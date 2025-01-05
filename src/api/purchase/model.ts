import mongoose, { Schema } from "mongoose";
import IPurchaseDoc from "./dto";

// Purchase Schema
const purchaseSchema = new Schema(
  {
    client_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Client ID is required"],
    },
    game_week: {
      type: String,
      required: [true, "Game week is required"],
    },
    team_name: {
      type: String,
      required: [true, "Team name is required"],
    },
    amount: {
      type: Number,
      default: 45,
      min: [0, "Amount can not be less than 1"],
    },
    is_package: {
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

// Purchase model
const Purchase = mongoose.model<IPurchaseDoc>("Purchase", purchaseSchema);

// Export model
export default Purchase;
