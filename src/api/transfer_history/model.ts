import mongoose, { Schema } from "mongoose";
import ITransferHistorytDoc from "./dto";

const transferHistorySchema: Schema = new Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "client id is required"],
    },
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "team id is required"],
    },
    bought_player: {
      full_name: {
        type: String,
        required: [true, "Player full name is required"],
      },
      club: { type: String, required: [true, "Player club is required"] },
      price: { type: Number, required: [true, "Player price is required"] },
    },
    sold_player: {
      full_name: {
        type: String,
        required: [true, "Player full name is required"],
      },
      club: { type: String, required: [true, "Player club is required"] },
      price: { type: Number, required: [true, "Player price is required"] },
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
const TransferHistoryModel = mongoose.model<ITransferHistorytDoc>(
  "TransferHistory",
  transferHistorySchema
);

export default TransferHistoryModel;
