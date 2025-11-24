import GameWeekModel from "./model";
import IGameWeekDoc, { Player } from "./dto";
import APIFeatures from "../../utils/api_features";
import init from "../../index";
import IGameWeekTeamDoc from "../game_week_team/dto";

// Data access layer class for game week
export default class GameWeekDAL {
  // Create gameweek
  static async createGameWeek(
    data: GameWeekRequest.ICreateGameWeek & {
      sid: string;
      cid: string;
      purchase_deadline: Date;
      transfer_deadline: Date;
      first_match_start_date: Date;
      last_match_end_date: Date;
      match_ids: string[];
    }
  ): Promise<IGameWeekDoc> {
    try {
      const gameWeek = await GameWeekModel.create({
        game_week: data.game_week,
        sid: data.sid,
        cid: data.cid,
        season_id: data.season_id,
        competition_id: data.competition_id,
        transfer_deadline: data.transfer_deadline,
        purchase_deadline: data.purchase_deadline,
        first_match_start_date: data.first_match_start_date,
        last_match_end_date: data.last_match_end_date,
        match_ids: data.match_ids,
        is_free: data.is_free,
        time_interval: new Date(
          data.first_match_start_date.getTime() + 15 * 60 * 1000
        ),
      });
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Create gameweek
  static async createDoubleGameWeek(
    data: GameWeekRequest.ICreateGameWeek & {
      sid: string;
      cid: string;
      purchase_deadline: Date;
      transfer_deadline: Date;
      first_match_start_date: Date;
      last_match_end_date: Date;
      match_ids: string[];
      is_double_gameweek: boolean;
      double_gameweek_first_match: Date;
      double_gameweek_transfer_deadline: Date;
      double_gameweek_teams: string[];
    }
  ): Promise<IGameWeekDoc> {
    try {
      const gameWeek = await GameWeekModel.create({
        game_week: data.game_week,
        sid: data.sid,
        cid: data.cid,
        season_id: data.season_id,
        competition_id: data.competition_id,
        transfer_deadline: data.transfer_deadline,
        purchase_deadline: data.purchase_deadline,
        first_match_start_date: data.first_match_start_date,
        last_match_end_date: data.last_match_end_date,
        match_ids: data.match_ids,
        is_free: data.is_free,
        time_interval: new Date(
          data.first_match_start_date.getTime() + 15 * 60 * 1000
        ),
        is_double_gameweek: data.is_double_gameweek,
        double_gameweek_first_match: data.double_gameweek_first_match,
        double_gameweek_transfer_deadline:
          data.double_gameweek_transfer_deadline,
        double_gameweek_teams: data.double_gameweek_teams,
      });
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Get all gameWeeks
  static async getAllGameWeeks(query: RequestQuery): Promise<IGameWeekDoc[]> {
    try {
      // Only sorting
      const apiFeature = new APIFeatures<IGameWeekDoc>(
        GameWeekModel.find(),
        query
      ).sort();
      const gameWeeks = await apiFeature.dbQuery;
      return gameWeeks;
    } catch (error) {
      throw error;
    }
  }

  // Get a game week by game week name
  static async getGameWeek(game_week: string): Promise<IGameWeekDoc | null> {
    try {
      const gameweek = await GameWeekModel.findOne({ game_week });
      if (gameweek) return gameweek;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get one game week
  static async getGameWeekById(id: string): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findById(id);
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Get an active game week
  static async getLiveGameWeek(): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findOne({ is_done: false });

      if (gameWeek) {
        return gameWeek;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update game week name
  static async updateGameWeekName(
    data: GameWeekRequest.IUpdateGameWeekName & {
      sid: string;
      cid: string;
      purchase_deadline: Date;
      transfer_deadline: Date;
      first_match_start_date: Date;
      last_match_end_date: Date;
      id: string;
    }
  ): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findByIdAndUpdate(
        data.id,
        {
          game_week: data.game_week,
          sid: data.sid,
          cid: data.cid,
          season_id: data.season_id,
          competition_id: data.competition_id,
          transfer_deadline: data.transfer_deadline,
          purchase_deadline: data.purchase_deadline,
          first_match_start_date: data.first_match_start_date,
          last_match_end_date: data.last_match_end_date,
        },
        { runValidators: true, new: true }
      );
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Update to Is Free
  static async updateToIsFree(data: {
    id: string;
    is_free: boolean;
  }): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findByIdAndUpdate(
        data.id,
        { is_free: data.is_free },
        { runValidators: true, new: true }
      );
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Update to done
  static async updateToDone(data: {
    id: string;
    is_done: boolean;
  }): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findByIdAndUpdate(
        data.id,
        { is_done: data.is_done },
        { runValidators: true, new: true }
      );
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Delete all
  static async deleteAllGameWeeks() {
    try {
      await GameWeekModel.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Delete game week by id
  static async deleteGameWeek(id: string): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findByIdAndDelete(id);
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Update status
  static async updateStatus(
    id: string,
    data: GameWeekRequest.IUpdateStatus
  ): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findByIdAndUpdate(id, data);
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Deactivate "is_done" field of the current live game week
  static async changeGameWeekToDone(
    live_gameweek_id: string
  ): Promise<IGameWeekDoc | null> {
    try {
      const liveGameWeek = await GameWeekModel.findByIdAndUpdate(
        live_gameweek_id,
        { is_done: true },
        { runValidators: true, new: true }
      );
      return liveGameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Get game_weeks in specific month
  static async getGameWeeksInMonth(
    monthAndYear: string
  ): Promise<IGameWeekDoc[]> {
    try {
      // Parse the YYYY-MM format properly
      const [yearStr, monthStr] = monthAndYear.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
      
      // Start of the given month
      const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      
      // Start of the next month
      const startOfNextMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
      
      const gameWeeks = await GameWeekModel.find({
        $and: [
          {
            purchase_deadline: { $gte: startOfMonth, $lt: startOfNextMonth },
          },
          { is_done: true },
        ],
      });
      
      return gameWeeks.map((doc) => doc._id);
    } catch (error) {
      throw error;
    }
  }

  // Add player stat to redis
  static async addPlayerStat(gameweekId: string, playerStat: Player[]) {
    try {
      const stat = await init.redis_client.sendCommand([
        "SET",
        `GW_${gameweekId}`,
        JSON.stringify(playerStat),
      ]);
      return stat;
    } catch (error) {
      throw error;
    }
  }

  // Get player stat
  static async getPlayerStat(gameweekId: string) {
    try {
      const stat = await init.redis_client.get(`GW_${gameweekId}`);
      if (stat) {
        return stat;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update cron job status for live rank
  static async updateCronJobStatus(data: {
    id: string;
    is_job_ongoing: boolean;
  }) {
    try {
      const gameWeek = await GameWeekModel.findByIdAndUpdate(
        data.id,
        {
          is_job_ongoing: data.is_job_ongoing,
        },
        { runValidators: true, new: true }
      );
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Update time interval
  static async updateTimeInterval(data: {
    id: string;
    time_interval: number;
  }): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findByIdAndUpdate(
        data.id,
        { time_interval: new Date(data.time_interval) },
        { runValidators: true, new: true }
      );
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Add Match ID
  static async addMatchId(data: {
    id: string;
    matchId: string;
  }): Promise<IGameWeekDoc | null> {
    try {
      const gameWeek = await GameWeekModel.findByIdAndUpdate(
        data.id,
        { $push: { match_ids: data.matchId } },
        { runValidators: true, new: true }
      );
      return gameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Count game weeks created
  static async gameWeeksCreated(): Promise<number> {
    try {
      const count = await GameWeekModel.find().count();
      return count;
    } catch (error) {
      throw error;
    }
  }

  // Update transfer and purchase deadlines
  static async updateDeadline(
    id: string,
    data: GameWeekRequest.IUpdateDeadline
  ): Promise<IGameWeekDoc | null> {
    try {
      const gameweek = await GameWeekModel.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return gameweek;
    } catch (error) {
      throw error;
    }
  }

  // Get all completed game weeks
  static async getCompletedGameWeeks(): Promise<IGameWeekDoc[]> {
    try {
      const completedGameWeeks = await GameWeekModel.find({ 
        is_done: true 
      }).sort({ createdAt: 1 });
      return completedGameWeeks;
    } catch (error) {
      throw error;
    }
  }
}
