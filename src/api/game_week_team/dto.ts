import { Document } from "mongoose";
import { IPlayersData } from "../team/dto";

// Interface for the game_week_team model
export default interface IGameWeekTeamDoc extends Document {
  client_id: string;
  team_id: string;
  cid: string;
  game_week_id: string;
  players: IPlayersData[];
  is_done: boolean;
  total_fantasy_point: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces for Game_Week - Team requests
declare global {
  namespace IGameWeekTeamRequest {
    interface ICreateGameWeekTeamInput {
      cid: string;
    }
    interface IDeleteAllGameWeekTeamInput {
      deleteKey: string;
    }
  }
}
