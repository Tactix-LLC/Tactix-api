import mongoose, { Schema } from "mongoose";
import ITransactionDoc from "./dto";

const transactionSchema: Schema = new Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "client id is required"],
    },
    transactionType: {
      type: String,
      required: [true, "transcrion type is required"],
      enum: {
        values: [
          "Package",
          "Deposit",
          "Prize-Bank",
          "Prize-Credit",
          "Purchase",
          "Comission-Bank",
          "Comission-Credit",
        ],
      },
    },
    amount: {
      type: Number,
      required: [true, "amount is required"],
      min: [0, "amount can not be less than 0"],
    },
    gameweek_package: {
      type: Number,
      default: 0,
      min: [0, "Number of gameweek package can not be less than 0"],
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
const TransactionModel = mongoose.model<ITransactionDoc>(
  "Transaction",
  transactionSchema
);

export default TransactionModel;
