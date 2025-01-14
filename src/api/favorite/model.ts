import mongoose, { Schema } from "mongoose";
import IFavoriteDoc from "./dto";

const favoriteSchema = new Schema({
  client_id: {
    type: mongoose.Types.ObjectId,
    ref: "Client",
    required: [true, "Client is required"],
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
});

// Create the model
const FavoriteModel = mongoose.model<IFavoriteDoc>("Favorite", favoriteSchema);

export default FavoriteModel;
