import TransferHistoryModel from "./model";
import ITransferHistoryDoc from "./dto";
import APIFeatures from "../../utils/api_features";

// Transfer History DAL
export default class TransferHistory {
  // Create Transfer History
  static async createTransferHistory(data: {
    client_id: string;
    team_id: string;
    bought_player: { full_name: string; club: string; price: number };
    sold_player: { full_name: string; club: string; price: number };
  }): Promise<ITransferHistoryDoc> {
    try {
      const transferHistory = await TransferHistoryModel.create(data);
      return transferHistory;
    } catch (error) {
      throw error;
    }
  }

  // Get Transcation hsistory of client
  static async getTransferHistories(
    id: string,
    query?: RequestQuery
  ): Promise<Array<ITransferHistoryDoc | null>> {
    try {
      const apiFeature = new APIFeatures<ITransferHistoryDoc>(
        TransferHistoryModel.find({ client_id: id }).populate({
          path: "client_id",
          select: "first_name last_name phone_number createdAt",
        }),
        query
      )
        .sort()
        .paginate();

      const transferHistories = await apiFeature.dbQuery;
      return transferHistories;
    } catch (error) {
      throw error;
    }
  }

  // Get transfer History
  static async getTransferHistoryById(
    id: string
  ): Promise<ITransferHistoryDoc | null> {
    try {
      const transferHistory = await TransferHistoryModel.findOne({
        _id: id,
      });
      return transferHistory;
    } catch (error) {
      throw error;
    }
  }

  // Get transfer History
  static async getAllTransferHistories(
    query?: any
  ): Promise<Array<ITransferHistoryDoc | null>> {
    try {
      const apiFeature = new APIFeatures<ITransferHistoryDoc>(
        TransferHistoryModel.find(),
        query
      )
        .sort()
        .paginate();

      const transferHistories = await apiFeature.dbQuery;
      return transferHistories;
    } catch (error) {
      throw error;
    }
  }

  // Delete all transfer transfer Histories
  static async deleteAllTransferHistories(): Promise<void> {
    try {
      await TransferHistoryModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  // Delete a transfer Histories
  static async deleteTransferHistory(id: string): Promise<void> {
    try {
      await TransferHistoryModel.deleteOne({ id });
    } catch (error) {
      throw error;
    }
  }

  // Transfer stat
  static async transferStat(): Promise<{
    boughtStat: ITransferHistoryDoc[];
    soldStat: ITransferHistoryDoc[];
    transfers: number;
  }> {
    try {
      const boughtStat = await TransferHistoryModel.aggregate([
        {
          $group: {
            _id: {
              bought_player: "$bought_player.full_name",
              club: "$bought_player.club",
            },
            bought: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { bought: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      const soldStat = await TransferHistoryModel.aggregate([
        {
          $group: {
            _id: {
              sold_player: "$sold_player.full_name",
              club: "$sold_player.club",
            },
            sold: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { sold: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      const transfers = await TransferHistoryModel.count();

      return { boughtStat, soldStat, transfers };
    } catch (error) {
      throw error;
    }
  }
}
