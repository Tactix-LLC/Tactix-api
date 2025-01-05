import { Player } from "../game_week/dto";
import IPlayerStatDoc, { IPlayerStat } from "./dto";
import PlayerStatModel from "./model";

// Player Stat Service
export default class PlayerStat {
  // Create player stat
  static async createPlayerStat(data: {
    gameweekid: string;
    players: IPlayerStat[];
  }): Promise<IPlayerStatDoc> {
    try {
      const playerStat = await PlayerStatModel.create({
        game_week_id: data.gameweekid,
        players: data.players,
      });
      return playerStat;
    } catch (error) {
      throw error;
    }
  }

  // Get player stat by game week
  static async getPlayerStatByGameweek(
    gameweekid: string
  ): Promise<IPlayerStatDoc | null> {
    try {
      const playerStat = await PlayerStatModel.findOne({
        game_week_id: gameweekid,
      }).populate({ path: "game_week_id", select: "game_week" });
      return playerStat;
    } catch (error) {
      throw error;
    }
  }

  // Get player stat by ID
  static async getPlayerStatById(id: string): Promise<IPlayerStatDoc | null> {
    try {
      const playerStat = await PlayerStatModel.findById(id).populate({
        path: "game_week_id",
        select: "game_week",
      });
      return playerStat;
    } catch (error) {
      throw error;
    }
  }

  // Get all time player stat
  static async getAllTimePlayerStat(query?: RequestQuery) {
    try {
      // Page
      const page = query?.page || 1;

      // Limit
      const limit = query?.limit || 20;

      // Skip
      const skip = (page - 1) * limit;

      const result = await PlayerStatModel.aggregate([
        {
          $unwind: "$players",
        },
        {
          $group: {
            _id: "$players.pid",
            full_name: { $first: "$players.full_name" },
            position: { $first: "$players.position" },
            tname: { $first: "$players.tname" },
            total_starting11_point: { $sum: "$players.starting11" },
            total_substitute_point: { $sum: "$players.substitute" },
            total_goal_scored_point: { $sum: "$players.goalscored" },
            total_assist_point: { $sum: "$players.assist" },
            total_passes_point: { $sum: "$players.passes" },
            total_shots_on_target_point: {
              $sum: "$players.shotsontarget",
            },
            total_chance_created_point: { $sum: "$players.chancecreated" },
            total_cleansheet_point: { $sum: "$players.cleansheet" },
            total_shots_saved_point: { $sum: "$players.shotssaved" },
            total_penalty_saved_point: { $sum: "$players.penaltysaved" },
            total_tacklesuccessful_point: { $sum: "$players.tacklesuccessful" },
            total_yellowcard_point: { $sum: "$players.yellowcard" },
            total_redcard_point: { $sum: "$players.redcard" },
            total_owngoal_point: { $sum: "$players.owngoal" },
            total_goalconceded_point: { $sum: "$players.goalsconceded" },
            total_penalty_missed_point: { $sum: "$players.penaltymissed" },
            total_interception_won_point: { $sum: "$players.interceptionwon" },
            total_fantasy_point: { $sum: "$players.fantasy_point" },
            total_minutes_played: { $sum: "$players.stat.minutesplayed" },
            total_goal_scored: { $sum: "$players.stat.goalscored" },
            total_assist: { $sum: "$players.stat.assist" },
            total_passes: { $sum: "$players.stat.passes" },
            total_shots_on_target: {
              $sum: "$players.stat.shotsontarget",
            },
            total_chance_created: { $sum: "$players.stat.chancecreated" },
            total_cleansheet: { $sum: "$players.stat.cleansheet" },
            total_shots_saved: { $sum: "$players.stat.shotssaved" },
            total_penalty_saved: { $sum: "$players.stat.penaltysaved" },
            total_tacklesuccessful: { $sum: "$players.stat.tacklesuccessful" },
            total_yellowcard: { $sum: "$players.stat.yellowcard" },
            total_redcard: { $sum: "$players.stat.redcard" },
            total_owngoal: { $sum: "$players.stat.owngoal" },
            total_goalconceded: { $sum: "$players.stat.goalsconceded" },
            total_penalty_missed: { $sum: "$players.stat.penaltymissed" },
            total_interception_won: { $sum: "$players.stat.interceptionwon" },
          },
        },
        {
          $sort: { total_fantasy_point: -1 },
        },
      ]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Delete a player stat by id
  static async deletePlayerStat(id: string): Promise<IPlayerStatDoc | null> {
    try {
      const playerStat = await PlayerStatModel.findByIdAndDelete(id);
      return playerStat;
    } catch (error) {
      throw error;
    }
  }

  // Update player's position
  static async updatePosAndPoint(
    id: string,
    players: IPlayerStat[]
  ): Promise<IPlayerStatDoc | null> {
    try {
      const player = await PlayerStatModel.findOneAndUpdate(
        { _id: id },
        { players }
      );
      return player;
    } catch (error) {
      throw error;
    }
  }
}
