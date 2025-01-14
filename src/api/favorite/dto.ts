import { Document } from "mongoose";

export default interface IFavoriteDoc extends Document {
  clientId: string;
  playerId: string;
  player_name: string;
  club_logo: string;
  position: string;
  team: string;
  player_number: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace FavoriteRequest {
    interface ICreateFavoriteInput {
      playerId: string;
      player_name: string;
      position: string;
      club_logo: string;
      team: string;
      player_number: string;
    }
  }
}
