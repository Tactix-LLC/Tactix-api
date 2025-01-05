import { Document } from "mongoose";

export default interface ITransferHistoryDoc extends Document {
  client_id: string;
  team_id: number;
  bought_player: { full_name: string; club: string; price: number };
  sold_player: { full_name: string; club: string; price: number };
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace TransferHistoryRequest {
    interface ICreateTransferHistoryInput {
      team_id: string;
      game_week: string;
      bought_player: { full_name: string; club: string; price: number };
      sold_player: { full_name: string; club: string; price: number };
    }

    interface IDeleteAllTransferHistoriesInput {
      deleteKey: string;
    }
  }
}
