import mongoose, { Schema } from "mongoose";
import ICommissionDoc from "./dto";

// Commission schema
const commissionSchema = new Schema(
  {
    client_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Client id is required"],
    },
    agent_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Agent id is required"],
    },
    amount: {
      type: Number,
      default: 25,
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

// Populate Client ID
commissionSchema.pre(/^find/, function (this: ICommissionDoc, next) {
  this.populate({ path: "client_id", select: "first_name last_name" });
  next();
});

// Commission model
const Commission = mongoose.model<ICommissionDoc>(
  "Commission",
  commissionSchema
);

// Export the model
export default Commission;
