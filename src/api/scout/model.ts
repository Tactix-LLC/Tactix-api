import mongoose, { Schema } from "mongoose";
import IScoutDoc from "./dto";

const scoutSchema: Schema = new Schema(
  {
    client_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "client id is required"],
    },
    player_id: {
      type: String,
      required: [true, "player id is required"],
    },
    player_name: {
      type: String,
      required: [true, "player name is required"],
    },
    club_logo: {
      type: String,
      required: [true, "Club logo is required"],
    },
    position: {
      type: String,
      required: [true, "player position is required"],
    },
    team: {
      type: String,
      required: [true, "Team name is required"],
    },
    player_number: {
      type: String,
      required: [true, "player number is required"],
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
const Scout = mongoose.model<IScoutDoc>("Scouts", scoutSchema);

export default Scout;
