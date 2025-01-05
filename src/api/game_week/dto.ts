import { Document } from "mongoose";

// Interface for the game_week model
export default interface IGameWeekDoc extends Document {
  game_week: string;
  sid: string;
  cid: string;
  season_id: string;
  competition_id: string;
  transfer_deadline: Date;
  purchase_deadline: Date;
  is_done: boolean;
  is_active: boolean;
  is_free: boolean;
  first_match_start_date: Date;
  last_match_end_date: Date;
  match_ids: string[];
  time_interval: Date;
  is_double_gameweek: boolean;
  double_gameweek_first_match: Date;
  double_gameweek_transfer_deadline: Date;
  double_gameweek_teams: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Player
export interface Player {
  pid: string;
  pname: string;
  role: string;
  tname: string;
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
  blockedshot: number;
  interceptionwon: number;
  clearance: number;
  point: number;
}

// Interface for incoming request
declare global {
  namespace GameWeekRequest {
    interface ICreateGameWeek {
      game_week: string;
      season_id: string;
      competition_id: string;
      is_free?: boolean;
    }
    interface ICreateGameWeekManual {
      game_week: string;
      season_id: string;
      competition_id: string;
      first_match_start_date: Date;
      last_match_end_date: Date;
      match_ids: string[];
      is_free?: boolean;
    }
    interface ICreateDoubleGameWeek {
      game_week: string;
      season_id: string;
      competition_id: string;
      first_match_start_date: Date;
      is_double_gameweek: boolean;
      double_gameweek_first_match: Date;
      double_gameweek_teams: string[];
      is_free?: boolean;
      match_ids: string[];
      last_match_end_date: Date;
    }
    interface IUpdateGameWeekName {
      game_week: string;
      season_id: string;
      competition_id: string;
    }
    interface IUpdateIsFree {
      is_free: boolean;
    }
    interface IUpdateToDone {
      is_done: boolean;
    }
    interface IUpdateStatus {
      is_active: boolean;
    }
    interface IDeleteGameWeek {
      delete_key: string;
    }
    interface IAddMatchId {
      match_id: string;
    }
    interface IUpdateDeadline {
      transfer_deadline: Date;
      purchase_deadline: Date;
      first_match_start_date: Date;
      last_match_end_date: Date;
      time_interval?: Date;
    }
  }
}
