import { Document } from "mongoose";

export default interface IPurchaseDoc extends Document {
  client_id: string;
  game_week: string;
  team_name: string;
  amount: number;
  is_package?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace PurchaseRequest {
    interface ICreatePurchase {
      client_id: string;
      game_week: string;
      team_name: string;
      amount?: number;
      is_package?: boolean;
    }
    interface IDeleteAllPurchases {
      delete_key: string;
    }
  }
}
