import mongoose, { Schema } from "mongoose";
import IWinnersDoc from "./dto";

// Winners schema
const winnersSchema = new Schema({
  client_id: {
    type: mongoose.Types.ObjectId,
    ref: "Client",
    required: [true, "Client id is required"],
  },
  game_week_id: {
    type: mongoose.Types.ObjectId,
    ref: "Gameweek",
    required: function (this: IWinnersDoc) {
      return this.weekly_monthly_yearly === "Weekly";
    },
  },
  month: {
    type: String,
    required: function (this: IWinnersDoc) {
      return this.weekly_monthly_yearly === "Monthly";
    },
  },
  season: {
    type: String,
    required: [true, "Season is required"],
  },
  weekly_monthly_yearly: {
    type: String,
    requierd: [true, "Prize type is required"],
    enum: {
      values: ["Weekly", "Monthly", "Yearly"],
      message: "Please select either Weekly or Yearly",
    },
  },
  prize: Number,
  total_fantasy_point: {
    type: Number,
    default: 0,
    min: [0, "Total fantasy point must be greater than or equal to zero"],
  },
  withdrawn: {
    type: Boolean,
    default: false,
  },
  is_approved: {
    type: Boolean,
    default: false,
  },
  is_credit: {
    type: Boolean,
    default: false,
  },
});

// Pre find hook
winnersSchema.pre(/^find/, function (this: IWinnersDoc, next) {
  this.populate({ path: "client_id", select: "first_name last_name phone_number" });
  next();
});

winnersSchema.index(
  { client_id: 1, game_week_id: 1 },
  { unique: true, partialFilterExpression: { weekly_monthly_yearly: "Weekly" } }
);

winnersSchema.index(
  { client_id: 1, month: 1 },
  {
    unique: true,
    partialFilterExpression: { weekly_monthly_yearly: "Monthly" },
  }
);

winnersSchema.index(
  { client_id: 1, season: 1 },
  { unique: true, partialFilterExpression: { weekly_monthly_yearly: "Yearly" } }
);

// Model
const Winners = mongoose.model<IWinnersDoc>("Winners", winnersSchema);

export default Winners;
