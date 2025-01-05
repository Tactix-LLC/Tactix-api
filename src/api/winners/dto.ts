import { Document } from "mongoose";

// Winners document structure
export default interface IWinnersDoc extends Document {
  client_id: string;
  game_week_id: string;
  season: string;
  weekly_monthly_yearly: string;
  prize: number;
  total_fantasy_point: number;
  is_approved: boolean;
  is_credit: boolean;
}

// Request inputs
declare global {
  namespace WinnersRequest {
    interface ICreateWinnerInput {
      client_id: string;
      game_week_id: string;
      season: string;
      weekly_monthly_yearly: string;
      prize: number;
      total_fantasy_point: number;
      is_credit: boolean;
    }
    interface IUpdatePrize {
      prize: number;
    }
    interface IUpdateIsCredit {
      is_credit: boolean;
    }
  }
}
