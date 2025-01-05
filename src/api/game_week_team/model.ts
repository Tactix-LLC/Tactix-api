import mongoose, { Schema } from "mongoose";
import IGameWeekTeamDoc from "./dto";

// Game_Week-Team schema
const gameWeekTeamSchema = new Schema(
  {
    client_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    team_id: {
      type: mongoose.Types.ObjectId,
      ref: "Team",
      required: [true, "Team is required"],
    },
    game_week_id: {
      type: mongoose.Types.ObjectId,
      ref: "GameWeek",
      required: [true, "Game week is required"],
    },
    cid: {
      type: String,
      required: [true, "Competition is required"],
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
        position: {
          type: String,
          required: [true, "Player position is required"],
          enum: {
            values: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
            message: "Unknown position selected",
          },
        },
        price: {
          type: Number,
          required: [true, "Player price is required"],
          min: [0, "Player price can not be less than zero"],
        },
        club: {
          type: String,
          required: [true, "Club to which the player plays is required"],
        },
        club_logo: {
          type: String,
          required: [
            true,
            "Logo of the club for which the player is playing is required",
          ],
        },
        is_bench: {
          type: Boolean,
          default: false,
        },
        is_captain: {
          type: Boolean,
          default: false,
        },
        is_vice_captain: {
          type: Boolean,
          default: false,
        },
        is_switched: {
          type: Boolean,
          default: false,
        },
        switched_by: String,
        fantasy_point: {
          type: Number,
          default: 0,
        },
        final_fantasy_point: {
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
        starting: {
          type: Number,
          default: 0,
        },
        substitute: {
          type: Number,
          default: 0,
        },
        blockedshot: {
          type: Number,
          default: 0,
        },
        interceptionwon: {
          type: Number,
          default: 0,
        },
        clearance: {
          type: Number,
          default: 0,
        },
        stat: {},
      },
    ],
    total_fantasy_point: { type: Number, default: 0 },
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
      virtuals: false,
    },
  }
);

// Pre find hook
gameWeekTeamSchema.pre(/^find/, function (this: IGameWeekTeamDoc, next) {
  this.populate({
    path: "game_week_id",
    select: "game_week deadline first_match_start_date is_done",
  });
  next();
});

// Create the model from the schema
const GameWeekTeam = mongoose.model<IGameWeekTeamDoc>(
  "GameWeekTeam",
  gameWeekTeamSchema
);

export default GameWeekTeam; // Export the model
