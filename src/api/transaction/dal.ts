import TransactionModel from "./model";
import ITransactionDoc from "./dto";
import APIFeatures from "../../utils/api_features";

// Transaction service
export default class Transaction {
  // Create Transaction
  static async createTransaction(data: {
    transactionType: string;
    amount: number;
    client_id: string;
    gameweek_package?: number;
  }): Promise<ITransactionDoc> {
    try {
      const transaction = await TransactionModel.create({
        client_id: data.client_id,
        transactionType: data.transactionType,
        amount: data.amount,
        gameweek_package: data.gameweek_package,
      });
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  // Get transcation of client
  static async getTranscations(
    id: string,
    query?: RequestQuery
  ): Promise<Array<ITransactionDoc | null>> {
    try {
      const apiFeature = new APIFeatures<ITransactionDoc>(
        TransactionModel.find({ client_id: id }),
        query
      )
        .sort()
        .paginate();

      const transactions = await apiFeature.dbQuery;
      return transactions;
    } catch (error) {
      throw error;
    }
  }

  // Get transaction
  static async getTransactionById(
    id: string
  ): Promise<Array<ITransactionDoc | null>> {
    try {
      const transaction = await TransactionModel.find({ _id: id }).populate({
        path: "client_id",
        select: "first_name last_name phone_number createdAt",
      });
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  // Get transaction
  static async getEveryTransactions(
    query?: any
  ): Promise<Array<ITransactionDoc | null>> {
    try {
      const apiFeature = new APIFeatures<ITransactionDoc>(
        TransactionModel.find().populate({
          path: "client_id",
          select: "first_name last_name phone_number createdAt",
        }),
        query
      )
        .sort()
        .paginate();

      const transactions = await apiFeature.dbQuery;
      return transactions;
    } catch (error) {
      throw error;
    }
  }

  // Delete all transactions
  static async deleteAllTransactions(): Promise<void> {
    try {
      await TransactionModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  // Delete a transaction
  static async deleteTransaction(id: string): Promise<void> {
    try {
      await TransactionModel.deleteOne({ id });
    } catch (error) {
      throw error;
    }
  }
}
