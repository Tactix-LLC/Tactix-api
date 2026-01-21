import mongoose from "mongoose";
import APIFeatures from "../../utils/api_features";
import GameWeekTeam from "../game_week_team/model";
import { IPlayersData } from "./dto";
import ITeamDoc from "./dto";
import Team from "./model";

// Data access layer for team
export default class TeamDAL {
  // Create team
  static async createTeam(
    client_id: string,
    data: ITeamRequest.ICreateTeamInput
  ): Promise<ITeamDoc> {
    try {
      const team = await Team.create({
        client_id,
        competition: data.competition,
        team_name: data.team_name,
        team_name_slug: data.team_name_slug,
        favorite_coach: data.favorite_coach,
        favorite_tactic: data.favorite_tactic,
        budget: data.budget,
        players: data.players,
      });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Get all teams in DB - for admin side
  static async getAllTeamsInDB(query?: RequestQuery): Promise<ITeamDoc[]> {
    try {
      const apiFeatures = new APIFeatures<ITeamDoc>(Team.find().lean(), query)
        .sort()
        .filter()
        .paginate()
        .project();
      const teams = await apiFeatures.dbQuery;
      return teams;
    } catch (error) {
      throw error;
    }
  }

  // Count all teams in DB
  static async countAllTeams(): Promise<number> {
    try {
      const teamCount = await Team.count();
      return teamCount;
    } catch (error) {
      throw error;
    }
  }

  // Get teams recursively
  static async getTeamsRecursivley(
    page: number,
    limit: number = 10
  ): Promise<ITeamDoc[]> {
    try {
      const skip = (page - 1) * 10;
      const teams = await Team.find().skip(skip).limit(limit).lean();
      return teams;
    } catch (error) {
      throw error;
    }
  }

  // Get all teams of a client - just for validation in the controller
  static async getClientTeams(client_id: string): Promise<ITeamDoc | null> {
    try {
      const teams = await Team.findOne({ client_id });
      return teams;
    } catch (error) {
      throw error;
    }
  }

  // Get a team by id - for a client
  static async getTeamByIdForClient(
    teamId: string,
    client_id: string
  ): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findOne({ _id: teamId, client_id });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Get team by id - for admin side
  static async getTeamByIdForAdmin(
    id: string,
    project?: boolean
  ): Promise<ITeamDoc | null> {
    try {
      let team: any = null;
      if (project) {
        team = await Team.findById(id).select(
          "total_fantasy_point favorite_coach favorite_tactic team_name budget id competition"
        );
      } else {
        team = await Team.findById(id);
      }
      return team;
    } catch (error) {
      throw error;
    }
  }

  //  Get team by name
  static async getTeamByNameForClient(
    id: string,
    team_name_slug: string,
    client_id: string
  ): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findOne({ id, team_name_slug, client_id });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Get by client id
  static async getTeamByClientID(client_id: string): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findOne({ client_id });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Check team name is not taken
  static async checkTeamNameIsAvailable(
    team_name_slug: string
  ): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findOne({ team_name_slug });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Delete a team of a client - for client
  static async deleteClientTeam(
    _id: string,
    client_id: string
  ): Promise<any | null> {
    try {
      const team = await Team.findOneAndDelete({ _id, client_id });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Delete team  - for admin side
  static async deleteTeam(id: string): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findByIdAndDelete(id);
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Delete all teams in DB - for admin side
  static async deleteAllTeams() {
    try {
      await Team.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Update team info
  static async updateTeam(
    _id: string,
    client_id: string,
    data: ITeamRequest.IUpdateTeamInput
  ): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findOneAndUpdate({ _id, client_id }, data, {
        new: true,
      });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Update team budget and players - will be used when joining a game_week_team
  static async updateTeamBudgetAndPlayers(
    _id: string,
    client_id: string,
    budget: number,
    players: Array<IPlayersData>
  ): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findOneAndUpdate(
        { _id, client_id },
        { budget, players },
        { new: true }
      );
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Update team players
  static async updateTeamPlayers(
    id: string,
    players: Array<IPlayersData>
  ): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findByIdAndUpdate(id, { players }, { new: true });
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Set team budget to 100 for all teams - will be used when deleting all game-week-team
  static async resetAllTeamsBudget() {
    try {
      await Team.updateMany({}, { budget: 100 });
    } catch (error) {
      throw error;
    }
  }

  // Switch players
  static async switchPlayers(
    id: string,
    data: Array<IPlayersData>
  ): Promise<ITeamDoc | null> {
    try {
      const gameWeekTeam = await Team.findByIdAndUpdate(
        id,
        {
          players: data,
        },
        { new: true }
      );
      return gameWeekTeam;
    } catch (error) {
      throw error;
    }
  }

  // Get all clients sorted by their total_fantasy_point
  static async getYearlyLeaderboard(query?: RequestQuery): Promise<ITeamDoc[]> {
    try {
      // const teams = await Team.find()
      //   .sort("-total_fantasy_point")
      //   .populate({ path: "client_id", select: "first_name last_name" })
      //   .select("total_fantasy_point")
      //   .limit(20);
      // return teams;

      // Page
      const page = query?.page || 1;

      // Limit
      const limit = query?.limit || 20;

      // Skip
      const skip = (page - 1) * limit;

      const result = await Team.aggregate([
        {
          $project: { client_id: 1, team_name: 1, total_fantasy_point: 1 },
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
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get client yearly rank
  static async getClientYearlyRank(client_id: string): Promise<ITeamDoc[]> {
    try {
      const result = await Team.aggregate([
        {
          $project: { client_id: 1, team_name: 1, total_fantasy_point: 1 },
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
          $match: { "client_id._id": new mongoose.Types.ObjectId(client_id) },
        },
      ]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get all clients sorted by their total_fantasy_point
  static async getYearlyLeaderboardWeb(): Promise<ITeamDoc[]> {
    try {
      const teams = await Team.find()
        .sort("-total_fantasy_point")
        .populate({ path: "client_id", select: "first_name last_name" })
        .select("total_fantasy_point")
        .lean();
      return teams;
    } catch (error) {
      throw error;
    }
  }

  // Update team fantasy point and players
  static async updateFantasyPointAndPlayers(data: {
    id: string;
    total_fantasy_point: number;
  }): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findByIdAndUpdate(
        data.id,
        {
          $set: { total_fantasy_point: data.total_fantasy_point },
        },
        { runValidators: true, new: true }
      );
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Update a team budget
  static async updateBudget(data: {
    amount: number;
    id: string;
  }): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findByIdAndUpdate(
        data.id,
        { budget: data.amount },
        { runValidators: true, new: true }
      );
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Update favorite_tactic tactical style
  static async updateTacticalStyle(data: {
    id: string;
    favorite_tactic: string;
  }): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findByIdAndUpdate(
        data.id,
        {
          favorite_tactic: data.favorite_tactic,
        },
        { runValidators: true, new: true }
      );
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Update favorite coach
  static async updateFavoriteCoach(data: {
    id: string;
    favorite_coach: string;
  }): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findByIdAndUpdate(
        data.id,
        {
          favorite_coach: data.favorite_coach,
        },
        {
          runValidators: true,
          new: true,
        }
      );
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Update team profile
  static async updateTeamProfile(data: {
    id: string;
    favorite_coach: string;
    favorite_tactic: string;
  }): Promise<ITeamDoc | null> {
    try {
      const team = await Team.findByIdAndUpdate(
        data.id,
        {
          favorite_coach: data.favorite_coach,
          favorite_tactic: data.favorite_tactic,
        },
        {
          runValidators: true,
          new: true,
        }
      );
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Reset team
  static async resetTeam(team: ITeamDoc): Promise<ITeamDoc> {
    try {
      team.budget = 100;
      team.players = [];
      await team.save();
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Recreate team
  static async recreateTeam(
    team: ITeamDoc,
    data: ITeamRequest.IRecreateTeam
  ): Promise<ITeamDoc> {
    try {
      team.budget = data.budget;
      team.players = data.players;
      await team.save();
      return team;
    } catch (error) {
      throw error;
    }
  }

  // Update player club in all current teams
  static async updatePlayerClubInAllTeams(
    playerId: string,
    club: string,
    clubLogo: string
  ): Promise<{ updatedTeams: number }> {
    try {
      // Update all teams that have this player
      const result = await Team.updateMany(
        { "players.pid": playerId },
        {
          $set: {
            "players.$.club": club,
            "players.$.club_logo": clubLogo,
          },
        }
      );
      return { updatedTeams: result.modifiedCount || 0 };
    } catch (error) {
      throw error;
    }
  }
}
