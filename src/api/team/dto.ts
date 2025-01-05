import { Document } from "mongoose";
import { Player } from "../game_week/dto";

// Interface for the team document
export default interface ITeamDoc extends Document {
  client_id: string;
  competition: string;
  team_name: string;
  team_name_slug: string;
  favorite_coach: string;
  favorite_tactic: string;
  budget: number;
  players: Array<IPlayersData>;
  total_fantasy_point: number;
  createdAt: Date;
  updatedAt: Date;
}

// Necessary data of players a client selected
export interface IPlayersData {
  full_name: string;
  pid: string;
  position: string;
  price: number;
  club: string;
  club_logo: string;
  is_bench: boolean;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_switched: boolean;
  switched_by: string;
  fantasy_point: number;
  final_fantasy_point: number;
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
  starting: number;
  substitute: number;
  blockedshot: number;
  interceptionwon: number;
  clearance: number;
  stat?: Player;
}

// Interface for incoming requests
declare global {
  namespace ITeamRequest {
    interface ICreateTeamInput {
      competition: string;
      team_name: string;
      team_name_slug: string;
      favorite_coach: string;
      favorite_tactic: string;
      budget: number;
      players: Array<IPlayersData>;
    }
    interface IUpdateTeamInput {
      team_name: string;
      team_name_slug: string;
      favorite_coach: string;
      favorite_tactic: string;
      budget: number;
    }
    interface ISwitchPlayersInput {
      pid: string;
    }
    interface IChangeCaptainViceCaptainInput {
      pid: string;
    }
    interface ITransferPlayerInput {
      full_name: string;
      pid: string;
      price: number;
      position: string;
      club: string;
      club_logo: string;
    }
    interface IUpdateBudgetInput {
      amount: number;
    }
    interface IUpdateFavoriteTactic {
      favorite_tactic: string;
    }
    interface IUpdateFavoriteCoach {
      favorite_coach: string;
    }
    interface IUpdateTeamProfile {
      favorite_coach: string;
      favorite_tactic: string;
    }
    interface IRecreateTeam {
      budget: number;
      players: Array<IPlayersData>;
    }
  }
}
