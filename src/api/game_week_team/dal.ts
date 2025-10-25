import mongoose from "mongoose";
import APIFeatures from "../../utils/api_features";
import GameWeekDAL from "../game_week/dal";
import GameWeek from "../game_week/model";
import { IPlayersData } from "../team/dto";
import IGameWeekTeamDoc from "./dto";
import GameWeekTeam from "./model";
import Client from "../client/model";
import IClientDoc from "../client/dto";

// Data access layer for game-week-team apis
export default class GameWeekTeamDAL {
  // Create game-week-team
  static async createGameWeekTeam(
    data: IGameWeekTeamRequest.ICreateGameWeekTeamInput & {
      client_id: string;
      team_id: string;
      game_week_id: string;
      players: Array<IPlayersData>;
    }
  ): Promise<IGameWeekTeamDoc> {
    try {
      const gameWeekTeam = await GameWeekTeam.create({
        client_id: data.client_id,
        team_id: data.team_id,
        cid: data.cid,
        players: data.players,
        game_week_id: data.game_week_id,
      });
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get game-week-team by id
  static async getGameWeekTeamById(
    _id: string
  ): Promise<IGameWeekTeamDoc | null> {
    try {
      const gameWeekTeam = await GameWeekTeam.findOne({ _id });
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get game-week-team by id
  static async getAllGameWeekTeams(
    query: RequestQuery
  ): Promise<Array<IGameWeekTeamDoc | null>> {
    try {
      const apiFeatures = new APIFeatures<IGameWeekTeamDoc>(
        GameWeekTeam.find().populate('client_id', 'first_name last_name phone_number email'),
        query
      )
        .sort()
        .paginate()
        .filter()
        .project();
      const gameWeekTeams = await apiFeatures.dbQuery;
      return gameWeekTeams;
    } catch (error) {
      throw error;
    }
  }

  // Get all game weeks a client has joined
  static async getClientGameWeekTeams(
    client_id: string
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      const clientGameWeeks = await GameWeekTeam.find({ client_id }).sort({
        createdAt: "desc",
      });
      return clientGameWeeks;
    } catch (error) {
      throw error;
    }
  }

  // Delete game-week-team by id
  static async deleteGameWeekTeamById(
    id: string
  ): Promise<IGameWeekTeamDoc | null> {
    try {
      const client = await GameWeekTeam.findByIdAndDelete(id);
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Delete all game-week-team
  static async deleteAllGameWeekTeams(): Promise<void> {
    try {
      await GameWeekTeam.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  // Delete game_week_teams by game_week_id
  static async deleteByGameWeekId(game_week_id: string) {
    try {
      await GameWeekTeam.deleteMany({ game_week_id });
    } catch (error) {
      throw error;
    }
  }

  // Get game-week-team by game week id
  static async getByGameWeekAndClientId(data: {
    client_id: string;
    game_week_id: string;
  }): Promise<IGameWeekTeamDoc | null> {
    try {
      const gameWeekTeam = await GameWeekTeam.findOne({
        $and: [
          { client_id: data.client_id },
          { game_week_id: data.game_week_id },
        ],
      });
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get game-week-team by the team id
  static async getByTeamId(team_id: string): Promise<IGameWeekTeamDoc[]> {
    try {
      const gameWeekTeam = await GameWeekTeam.find({
        team_id,
      }).populate({
        path: "team_id",
        select: "team_name favorite_tactic budget total_team_point",
      });
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get game_week_team by id for the logged in client
  static async getGameWeekTeamOfClientById(
    _id: string,
    client_id: string
  ): Promise<IGameWeekTeamDoc | null> {
    try {
      const gameWeekTeam = await GameWeekTeam.findOne({
        _id,
        client_id,
      });
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get all gameweek teams in a specific game week
  static async getAllGameWeekTeamByGameWeekId(
    gameweekId: string
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      const gameweekTeams = await GameWeekTeam.find({
        game_week_id: gameweekId,
      })
        .sort("-total_fantasy_point")
        .lean();
      return gameweekTeams;
    } catch (error) {
      throw error;
    }
  }

  // Get by game_week id
  static async getByGameWeekId(
    game_week_id: string,
    query?: RequestQuery
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IGameWeekTeamDoc>(
        GameWeekTeam.find({ game_week_id }).populate('client_id', 'first_name last_name phone_number email'),
        query
      )
        .filter()
        .sort()
        .project()
        .paginate();
      const gameWeekTeam = await apiFeatures.dbQuery;
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get by game_week id
  static async countClientsInGameWeek(game_week_id: string): Promise<number> {
    try {
      const clients = await GameWeekTeam.count({ game_week_id });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Update players of game_week_team - will be used when a user switchs or transfers players
  static async updateGameWeekPlayersOfClient(
    _id: string,
    players: Array<IPlayersData>
  ): Promise<IGameWeekTeamDoc | null> {
    try {
      const gameWeekTeam = await GameWeekTeam.findByIdAndUpdate(
        _id,
        { players },
        {
          runValidators: true,
          new: true,
        }
      );
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Update game week total point and players
  static async updateTotalGameWeekPointAndPlayers(data: {
    id: string;
    total_point: number;
    players: IPlayersData[];
  }) {
    try {
      const gameWeekTeam = await GameWeekTeam.findByIdAndUpdate(
        data.id,
        {
          total_fantasy_point: data.total_point,
          players: data.players,
        },
        { runValidators: true, new: true }
      );
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get monthly leaderboard
  static async getMonthlyLeaderbaord(
    monthAndYear: string,
    query?: RequestQuery
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      // Get all game_weeks in the selected month
      const gameWeeksInMonth = await GameWeekDAL.getGameWeeksInMonth(
        monthAndYear
      );

      // Page
      const page = query?.page || 1;

      // Limit
      const limit = query?.limit || 20;

      // Skip
      const skip = (page - 1) * limit;

      // Get all game_week_teams in each game_weeks in the selected month
      const monthlyLeaderboard = await GameWeekTeam.aggregate([
        {
          $match: { game_week_id: { $in: gameWeeksInMonth } },
        },
        {
          $group: {
            _id: "$client_id",
            total_fantasy_point: { $sum: "$total_fantasy_point" },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client_id",
            pipeline: [
              {
                $addFields: {
                  full_name: { $concat: ["$first_name", " ", "$last_name"] },
                  id: "$_id",
                },
              },
              {
                $project: { first_name: 1, last_name: 1, full_name: 1, id: 1 },
              },
            ],
          },
        },
        {
          $sort: {
            total_fantasy_point: -1,
          },
        },
        {
          $unwind: "$client_id",
        },
        {
          $setWindowFields: {
            sortBy: { total_fantasy_point: -1 },
            output: {
              rank: {
                $rank: {},
              },
            },
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      // Group and aggergate game_week_teams by client
      return monthlyLeaderboard;
    } catch (error) {
      throw error;
    }
  }

  // Get client monthly rank
  static async getClientMonthlyRank(
    monthAndYear: string,
    client_id: string
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      // Get all game_weeks in the selected month
      const gameWeeksInMonth = await GameWeekDAL.getGameWeeksInMonth(
        monthAndYear
      );

      // Get all game_week_teams in each game_weeks in the selected month
      const monthlyLeaderboard = await GameWeekTeam.aggregate([
        {
          $match: { game_week_id: { $in: gameWeeksInMonth } },
        },
        {
          $group: {
            _id: "$client_id",
            total_fantasy_point: { $sum: "$total_fantasy_point" },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client_id",
            pipeline: [
              {
                $addFields: {
                  full_name: { $concat: ["$first_name", " ", "$last_name"] },
                  id: "$_id",
                },
              },
              {
                $project: { first_name: 1, last_name: 1, full_name: 1, id: 1 },
              },
            ],
          },
        },
        {
          $sort: {
            total_fantasy_point: -1,
          },
        },
        {
          $unwind: "$client_id",
        },
        {
          $setWindowFields: {
            sortBy: { total_fantasy_point: -1 },
            output: {
              rank: {
                $rank: {},
              },
            },
          },
        },
        {
          $match: { _id: new mongoose.Types.ObjectId(client_id) },
        },
      ]);
      // Group and aggergate game_week_teams by client
      return monthlyLeaderboard;
    } catch (error) {
      throw error;
    }
  }

  // Get weekly leaderboard
  static async getWeeklyLeaderboard(
    gameweekId: string,
    query?: RequestQuery
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      // const gameweekTeams = await GameWeekTeam.find({
      //   game_week_id: gameweekId,
      // })
      //   .sort("-total_fantasy_point")
      //   .populate({ path: "client_id", select: "first_name last_name" })
      //   .select("total_fantasy_point")
      //   .limit(20);

      // return gameweekTeams;

      // Page
      const page = query?.page || 1;

      // Limit
      const limit = query?.limit || 20;

      // Skip
      const skip = (page - 1) * limit;

      const result = await GameWeekTeam.aggregate([
        {
          $match: {
            game_week_id: new mongoose.Types.ObjectId(gameweekId),
          },
        },
        {
          $project: { client_id: 1, team_id: 1, total_fantasy_point: 1 },
        },
        {
          $lookup: {
            from: "clients",
            localField: "client_id",
            foreignField: "_id",
            as: "client_id",
            pipeline: [
              {
                $addFields: {
                  full_name: { $concat: ["$first_name", " ", "$last_name"] },
                  id: "$_id",
                },
              },
              {
                $project: { first_name: 1, last_name: 1, full_name: 1, id: 1 },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "teams",
            localField: "team_id",
            foreignField: "_id",
            as: "team_id",
            pipeline: [
              {
                $project: { team_name: 1 },
              },
            ],
          },
        },
        {
          $unwind: "$client_id",
        },
        {
          $unwind: "$team_id",
        },
        {
          $setWindowFields: {
            sortBy: { total_fantasy_point: -1 },
            output: {
              rank: {
                $rank: {},
              },
            },
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get client weekly rank
  static async getClientWeeklyRank(
    gameweekId: string,
    client_id: string
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      const result = await GameWeekTeam.aggregate([
        {
          $match: {
            game_week_id: new mongoose.Types.ObjectId(gameweekId),
          },
        },
        {
          $project: { client_id: 1, team_id: 1, total_fantasy_point: 1 },
        },
        {
          $lookup: {
            from: "clients",
            localField: "client_id",
            foreignField: "_id",
            as: "client_id",
            pipeline: [
              {
                $addFields: {
                  full_name: { $concat: ["$first_name", " ", "$last_name"] },
                  id: "$_id",
                },
              },
              {
                $project: { first_name: 1, last_name: 1, full_name: 1, id: 1 },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "teams",
            localField: "team_id",
            foreignField: "_id",
            as: "team_id",
            pipeline: [
              {
                $project: { team_name: 1 },
              },
            ],
          },
        },
        {
          $unwind: "$client_id",
        },
        {
          $unwind: "$team_id",
        },
        {
          $setWindowFields: {
            sortBy: { total_fantasy_point: -1 },
            output: {
              rank: {
                $rank: {},
              },
            },
          },
        },
        {
          $match: { "client_id._id": new mongoose.Types.ObjectId(client_id) },
        },
      ]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get weekly leaderboard
  static async getWeeklyLeaderboardWeb(
    gameweekId: string
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      const gameweekTeams = await GameWeekTeam.find({
        game_week_id: gameweekId,
      })
        .sort("-total_fantasy_point")
        .populate({ path: "client_id", select: "first_name last_name" })
        .select("total_fantasy_point")
        .lean();

      return gameweekTeams;
    } catch (error) {
      throw error;
    }
  }

  // Get gameweeks teams for point
  static async getGameweekTeamsForPoint(
    gameweekId: string,
    page: number,
    limit: number = 10
  ): Promise<IGameWeekTeamDoc[]> {
    try {
      const skip = (page - 1) * limit;
      const gameWeekTeams = await GameWeekTeam.find({
        game_week_id: gameweekId,
      })
        .skip(skip)
        .limit(limit)
        .lean();
      return gameWeekTeams;
    } catch (error) {
      throw error;
    }
  }

  // Get client game week team
  static async getClientGameWeekTeam(
    game_week_id: string,
    client_id: string
  ): Promise<IGameWeekTeamDoc | null> {
    try {
      const gameWeekTeam = await GameWeekTeam.findOne({
        $and: [{ game_week_id, client_id }],
      });
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Players selection stat
  static async playerSelectionStat(): Promise<{
    mostSelectedPlayer: IGameWeekTeamDoc[];
    mostCaptainedPlayer: IGameWeekTeamDoc[];
    mostViceCaptainedPlayer: IGameWeekTeamDoc[];
  }> {
    try {
      const mostSelectedPlayer = await GameWeekTeam.aggregate([
        {
          $unwind: "$players",
        },
        {
          $group: {
            _id: {
              full_name: "$players.full_name",
              club: "$players.club",
              club_logo: "$players.club_logo",
              position: "$players.position",
            },
            selected: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { selected: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      const mostCaptainedPlayer = await GameWeekTeam.aggregate([
        {
          $unwind: "$players",
        },
        {
          $match: { "players.is_captain": true },
        },
        {
          $group: {
            _id: {
              full_name: "$players.full_name",
              club: "$players.club",
              club_logo: "$players.club_logo",
              position: "$players.position",
            },
            selected: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { selected: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      const mostViceCaptainedPlayer = await GameWeekTeam.aggregate([
        {
          $unwind: "$players",
        },
        {
          $match: { "players.is_vice_captain": true },
        },
        {
          $group: {
            _id: {
              full_name: "$players.full_name",
              club: "$players.club",
              club_logo: "$players.club_logo",
              position: "$players.position",
            },
            selected: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { selected: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      return {
        mostSelectedPlayer,
        mostCaptainedPlayer,
        mostViceCaptainedPlayer,
      };
    } catch (error) {
      throw error;
    }
  }

  // Players selection stat
  static async playerSelectionGameWeekStat(game_week_id: string): Promise<{
    mostSelectedPlayer: IGameWeekTeamDoc[];
    mostCaptainedPlayer: IGameWeekTeamDoc[];
    mostViceCaptainedPlayer: IGameWeekTeamDoc[];
  }> {
    try {
      const mostSelectedPlayer = await GameWeekTeam.aggregate([
        {
          $match: {
            game_week_id: new mongoose.Types.ObjectId(game_week_id),
          },
        },
        {
          $unwind: "$players",
        },
        {
          $group: {
            _id: {
              full_name: "$players.full_name",
              club: "$players.club",
              club_logo: "$players.club_logo",
              position: "$players.position",
            },
            selected: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { selected: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      const mostCaptainedPlayer = await GameWeekTeam.aggregate([
        {
          $match: {
            game_week_id: new mongoose.Types.ObjectId(game_week_id),
          },
        },
        {
          $unwind: "$players",
        },
        {
          $match: { "players.is_captain": true },
        },
        {
          $group: {
            _id: {
              full_name: "$players.full_name",
              club: "$players.club",
              club_logo: "$players.club_logo",
              position: "$players.position",
            },
            selected: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { selected: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      const mostViceCaptainedPlayer = await GameWeekTeam.aggregate([
        {
          $match: {
            game_week_id: new mongoose.Types.ObjectId(game_week_id),
          },
        },
        {
          $unwind: "$players",
        },
        {
          $match: { "players.is_vice_captain": true },
        },
        {
          $group: {
            _id: {
              full_name: "$players.full_name",
              club: "$players.club",
              club_logo: "$players.club_logo",
              position: "$players.position",
            },
            selected: { $sum: 1 },
          },
        },
        {
          $addFields: {
            player_info: "$_id",
          },
        },
        {
          $sort: { selected: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      return {
        mostSelectedPlayer,
        mostCaptainedPlayer,
        mostViceCaptainedPlayer,
      };
    } catch (error) {
      throw error;
    }
  }

  // Clients/teams that have not joined the game week
  static async getClientsNotJoinedGamweek(
    game_week_id: string
  ): Promise<IClientDoc[]> {
    try {
      // Game week team in a game week
      const clientIdsInGameWeek = await GameWeekTeam.find({
        game_week_id,
      }).select("client_id");

      // Put user ids in a temporary array
      const userIds = clientIdsInGameWeek.map((client) => {
        client.client_id;
      });

      // Find
      const clients = Client.find({ _id: { $nin: userIds } });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Agents joined a game week
  static async getAgentsJoinedGameweek() {
    try {
      const agents = await GameWeekTeam.aggregate([
        {
          $group: {
            _id: "$client_id",
            total: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client_id",
            pipeline: [
              {
                $match: { is_agent: true },
              },
              {
                $project: { is_agent: 1 },
              },
            ],
          },
        },
        {
          $unwind: "$client_id",
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return agents;
    } catch (error) {
      throw error;
    }
  }

  // Get phone numbers of clients who joined
  static async getPhoneNumbersOfClients() {
    try {
      const phoneNumbers = await GameWeekTeam.aggregate([
        {
          $group: {
            _id: "$client_id",
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client_id",
            pipeline: [
              {
                $project: { phone_number: 1 },
              },
            ],
          },
        },
        {
          $unwind: { path: "$client_id" },
        },
      ]);
      return phoneNumbers;
    } catch (error) {
      throw error;
    }
  }

  // Get teams that have a specific player
  static async getTeamsWithPlayer(gameWeekId: string, playerId: string): Promise<IGameWeekTeamDoc[]> {
    try {
      const teams = await GameWeekTeam.find({
        game_week_id: gameWeekId,
        "players.pid": playerId
      });
      return teams;
    } catch (error) {
      throw error;
    }
  }
}
