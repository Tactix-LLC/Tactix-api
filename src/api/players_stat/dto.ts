import { Document } from "mongoose";
import { Player } from "../game_week/dto";

export interface IPlayerStat {
  full_name: string;
  pid: string;
  tname: string;
  role: string;
  position: string;
  fantasy_point: number;
  minutesplayed: number;
  goalscored: number;
  assist: number;
  passes: number;
  shotsontarget: number;
  cleansheet: number;
  shotssaved: number;
  penaltysaved: number;
  tacklesuccessful: number;
  yellowcard: number;
  redcard: number;
  owngoal: number;
  goalsconceded: number;
  penaltymissed: number;
  chancecreated: number;
  starting11: number;
  substitute: number;
  interceptionwon: number;
  clearance: number;
  stat?: Player;
}

export default interface IPlayerStatDoc extends Document {
  game_week_id: string;
  players: [IPlayerStat];
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace PlayerStatRequest {
    interface ICreatePlayerStat {
      gameweekid: string;
    }
    interface IUpdatePosAndPoint {
      pid: string;
      position: string;
      fantasy_point: number;
      goalscored: number;
    }
  }
}
