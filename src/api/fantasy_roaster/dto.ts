import { Document } from "mongoose";

// Fantasy Roaster Interface
export default interface IFantasyRoasterDoc extends Document {
  season_name: string;
  is_active: boolean;
  players: IFantasyRoasterPlayer[];
  createdAt: Date;
  updatedAt: Date;
}

// Team interface
export interface ITeam {
  tid: string;
  tname: string;
  logo: string;
  fullname: string;
  abbr: string;
}

// Player
export interface IPlayer {
  pid: string;
  pname: string;
  role: string;
  rating: string;
  prev_rating: string;
  team: ITeam;
}

// Fantasy Roaster Player
export interface IFantasyRoasterPlayer extends IPlayer {
  is_new_transfer: boolean;
  transfer_radar: boolean;
}

declare global {
  namespace FantasyRoasterRequest {
    interface ICreateFantasyRoasterInput {
      season_name: string;
      players: IPlayer[];
    }
    interface IUpdatePlayerRating {
      pid: string;
      rating: number;
      prev_rating: number;
    }
    interface IUpdateRoasterStatusInput {
      is_active: boolean;
    }
    interface IDeleteRoastersInput {
      delete_key: string;
    }
    interface IUpdateTransferRadar {
      transfer_radar: boolean;
      pid: string;
    }
    interface IRemovePlayer {
      pid: string;
    }
    interface IAddPlayer {
      pid: string;
      pname: string;
      role: string;
      rating: string;
      tid: string;
      tname: string;
      logo: string;
      fullname: string;
      abbr: string;
    }
    interface IUpdatePlayerTeam {
      pid: string;
      team: {
        tid: string;
        tname: string;
        logo: string;
        fullname: string;
        abbr: string;
      };
    }
  }
}
