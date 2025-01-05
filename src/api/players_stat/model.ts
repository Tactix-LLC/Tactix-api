import mongoose, { Schema } from "mongoose";
import IPlayerStatDoc from "./dto";

// Players stat
const playersStatSchema = new Schema(
  {
    game_week_id: {
      type: mongoose.Types.ObjectId,
      ref: "GameWeek",
      unique: true,
    },
    players: [
      {
        full_name: {
          type: String,
          required: [true, "Player full name is required"],
        },
        pid: {
          type: String,
          required: [true, "Player id is requried"],
        },
        tname: {
          type: String,
          required: [true, "Team name is required"],
        },
        position: {
          type: String,
          required: [true, "Player position is required"],
          enum: {
            values: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
            message: "Unknown position selected",
          },
        },
        fantasy_point: {
          type: Number,
          default: 0,
        },
        minutesplayed: {
          type: Number,
          default: 0,
        },
        goalscored: {
          type: Number,
          default: 0,
        },
        assist: {
          type: Number,
          default: 0,
        },
        passes: {
          type: Number,
          default: 0,
        },
        shotsontarget: {
          type: Number,
          default: 0,
        },
        cleansheet: {
          type: Number,
          default: 0,
        },
        shotssaved: {
          type: Number,
          default: 0,
        },
        penaltysaved: {
          type: Number,
          default: 0,
        },
        tacklesuccessful: {
          type: Number,
          default: 0,
        },
        yellowcard: {
          type: Number,
          default: 0,
        },
        redcard: {
          type: Number,
          default: 0,
        },
        owngoal: {
          type: Number,
          default: 0,
        },
        goalsconceded: {
          type: Number,
          default: 0,
        },
        penaltymissed: {
          type: Number,
          default: 0,
        },
        chancecreated: {
          type: Number,
          default: 0,
        },
        starting11: {
          type: Number,
          default: 0,
        },
        substitute: {
          type: Number,
          default: 0,
        },
        interceptionwon: {
          type: Number,
          default: 0,
        },
        stat: {},
      },
    ],
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

// Players Stat model
const PlayerStat = mongoose.model<IPlayerStatDoc>(
  "PlayerStat",
  playersStatSchema
);

// Export model
export default PlayerStat;
