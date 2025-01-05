import { Document } from "mongoose";

export default interface ITransactionDoc extends Document {
  transactionType: string;
  amount: number;
  client_id: string;
  gameweek_package?: number;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace TransactionRequest {
    interface ICreateTransactionInput {
      transactionType: string;
      amount: number;
    }

    interface IDeleteAllTransactionsInput {
      deleteKey: string;
    }
  }
}
