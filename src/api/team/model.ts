import mongoose, { Schema } from "mongoose";
import ITeamDoc from "./dto";

// Team schema
const teamSchema = new Schema(
  {
    client_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    competition: {
      type: mongoose.Types.ObjectId,
      ref: "Competition",
      required: [true, "Competition is requried"],
    },
    team_name: {
      type: String,
      required: [true, "Team name is required"],
      minlength: [1, "Team name should have at least 2 characters"],
      maxlength: [50, "Team name can not contain more than 50 characters"],
    },
    team_name_slug: {
      type: String,
      required: [true, "Team name slug is required"],
    },
    favorite_coach: {
      type: mongoose.Types.ObjectId,
      ref: "Coach",
      required: [true, "Please select your favorite team"],
    },
    favorite_tactic: {
      type: String,
      required: [true, "Favorite tactic is required"],
    },
    budget: {
      type: Number,
      default: 100,
      min: [0, "Budget can not be less than zero"],
      max: [100, "Budget can not be more than 100"],
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
          default: "Unknown",
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
    total_fantasy_point: {
      type: Number,
      default: 0,
      min: [0, "Total team point can not be less than zero"],
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

// Team model
const Team = mongoose.model<ITeamDoc>("Team", teamSchema);

export default Team; // Export the model
