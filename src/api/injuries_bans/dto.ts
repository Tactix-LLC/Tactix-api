import { Document } from "mongoose";

export interface IInjuriesBanPlayer {
  pid: string;
  pname: string;
  role: string;
  rating: string;
  team: {
    tid: string;
    tname: string;
    logo: string;
    fullname: string;
    abbr: string;
  };
}

export default interface IInjuriesBanDoc extends Document {
  player: IInjuriesBanPlayer;
  state: string;
  injury_title: string;
  chance: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Injuries and bans request
declare global {
  namespace InjuriesBanRequest {
    interface ICreateInjuryBan {
      player: IInjuriesBanPlayer;
      state: string;
      injury_title?: string;
      chance: number;
    }
    interface IUpdateInjuryBan {
      state: string;
      injury_title: string;
      chance: number;
    }
    interface IDeleteAllInjuriesBans {
      delete_key: string;
    }
  }
}
