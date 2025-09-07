import APIFeatures from "../../utils/api_features";
import IWinnersDoc from "./dto";
import WinnersModel from "./model";

// Data access layer for winners
export default class Winners {
  // Create winners
  static async createWinner(
    data: WinnersRequest.ICreateWinnerInput
  ): Promise<IWinnersDoc> {
    try {
      const winner = await WinnersModel.create(data);
      return winner;
    } catch (error) {
      throw error;
    }
  }

  // Get all winners
  static async getAllWinners(): Promise<IWinnersDoc[]> {
    try {
      const winners = await WinnersModel.find()
        .populate("client_id", "first_name last_name phone_number email")
        .populate("game_week_id", "game_week")
        .sort("-createdAt");
      return winners;
    } catch (error) {
      throw error;
    }
  }

  // Get weekly winners
  static async getWeeklyWinners(game_week_id: string): Promise<IWinnersDoc[]> {
    try {
      const weeklyWinners = await WinnersModel.find({
        game_week_id,
        weekly_monthly_yearly: "Weekly",
      }).sort("-prize");

      return weeklyWinners;
    } catch (error) {
      throw error;
    }
  }

  // Get all winners in a year/season
  static async getYearlyWinners(
    season: string,
    query: RequestQuery
  ): Promise<IWinnersDoc[]> {
    try {
      const apiFeatures = new APIFeatures(
        WinnersModel.find({ weekly_monthly_yearly: "Yearly" }),
        query
      )
        .sort()
        .paginate();

      const yearlyWinners = await apiFeatures.dbQuery;
      return yearlyWinners;
    } catch (error) {
      throw error;
    }
  }

  // Update winner prize
  static async updatePrize(
    client_id: string,
    prize: number
  ): Promise<IWinnersDoc | null> {
    try {
      const winner = await WinnersModel.findByIdAndUpdate(
        client_id,
        { prize },
        { runValidators: true, new: true }
      );
      return winner;
    } catch (error) {
      throw error;
    }
  }

  // Get awards of a client
  static async getClientAwards(clientId: string): Promise<IWinnersDoc[]> {
    try {
      const clientAwards = await WinnersModel.find({ client_id: clientId });
      return clientAwards;
    } catch (error) {
      throw error;
    }
  }

  // Delete winner
  static async deleteWinner(client_id: string): Promise<IWinnersDoc | null> {
    try {
      const winner = await WinnersModel.findByIdAndDelete(client_id);
      return winner;
    } catch (error) {
      throw error;
    }
  }

  // Delete all winners
  static async deleteAllWinners() {
    try {
      await WinnersModel.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Get monthly winners
  static async getMonthlyWinners(month: string): Promise<IWinnersDoc[]> {
    try {
      const monthlyWinners = await WinnersModel.find({
        weekly_monthly_yearly: "Monthly",
        month,
      });
      return monthlyWinners;
    } catch (error) {
      throw error;
    }
  }

  // Get winner by winner id
  static async getWinnerById(id: string): Promise<IWinnersDoc | null> {
    try {
      const winner = await WinnersModel.findById(id);
      return winner;
    } catch (error) {
      throw error;
    }
  }

  // Update winner approval status
  static async approveWinner(id: string): Promise<IWinnersDoc | null> {
    try {
      const winner = await WinnersModel.findByIdAndUpdate(
        id,
        { is_approved: true },
        {
          runValidators: true,
          new: true,
        }
      );
      return winner;
    } catch (error) {
      throw error;
    }
  }

  // Make prize for credit
  static async updateIsCredit(
    id: string,
    is_credit: boolean
  ): Promise<IWinnersDoc | null> {
    try {
      const winner = await WinnersModel.findByIdAndUpdate(
        id,
        { is_credit },
        { runValidators: true, new: true }
      );
      return winner;
    } catch (error) {
      throw error;
    }
  }
}
