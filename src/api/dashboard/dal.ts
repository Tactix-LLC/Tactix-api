import IPlayerDoc from "../client/dto";
import GameWeekTeam from "../game_week_team/model";
import Clients from "../client/model";
import AgentRequest from "../agent_request/model";
import Team from "../team/model";
import Commission from "../commission/model";

/**
 * Data access layer for dashboard analytics
 */
export default class DashBoard {
  // Get clients joined in each game week
  static async clientsJoinedInEachGameWeek() {
    try {
      // Get clients joined in each game week
      const clientsInEachgameWeek = await GameWeekTeam.aggregate([
        {
          $group: {
            _id: "$game_week_id",
            clientsJoined: {
              $count: {},
            },
          },
        },
        {
          $lookup: {
            from: "gameweeks",
            localField: "_id",
            foreignField: "_id",
            as: "game_week",
          },
        },
        {
          $unwind: "$game_week",
        },
        {
          $project: {
            _id: 0,
            game_week: "$game_week.game_week", // Extract the name property from the game_week object
            clientsJoined: 1,
          },
        },
      ]);
      return clientsInEachgameWeek;
    } catch (error) {
      throw error;
    }
  }

  // Get clients who played in each month
  static async clientsPlayedInEachMonth() {
    try {
      const clientsPlayedInEachMonth = await GameWeekTeam.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            clientsPlayed: { $sum: 1 },
          },
        },
        {
          $project: {
            month: "$_id",
            clientsPlayed: 1,
            _id: 0,
          },
        },
      ]);

      return clientsPlayedInEachMonth;
    } catch (error) {
      throw error;
    }
  }

  // Get clients who signed up in each month
  static async clientsSignedUpEachMonth() {
    try {
      const clientsSignedUp = await Clients.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            clientSignedUp: { $sum: 1 },
          },
        },
        {
          $project: {
            month: "$_id",
            clientSignedUp: 1,
            _id: 0,
          },
        },
      ]);

      return clientsSignedUp;
    } catch (error) {
      throw error;
    }
  }

  // Get number of clients that joined free and and paid game weeks
  static async clientsJoinedFreeAndPaidGameWeek() {
    try {
      const clientsJoinedFreeAndPaidGameWeeks = await GameWeekTeam.aggregate([
        {
          $lookup: {
            from: "gameweeks", // Name of the game_week collection
            localField: "game_week_id",
            foreignField: "_id",
            as: "game_week",
          },
        },
        {
          $unwind: "$game_week",
        },
        {
          $group: {
            _id: "$game_week.is_free",
            clients: { $sum: 1 },
          },
        },
        {
          $project: {
            is_free: "$_id",
            clients: 1,
            _id: 0,
          },
        },
      ]);
      return clientsJoinedFreeAndPaidGameWeeks;
    } catch (error) {
      throw error;
    }
  }

  // Get number of agent requests by status
  static async agentRequestsByStatus() {
    try {
      const agents = await AgentRequest.aggregate([
        {
          $group: {
            _id: "$status",
            agentRequests: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            agentRequests: 1,
            _id: 0,
          },
        },
      ]);
      return agents;
    } catch (error) {
      throw error;
    }
  }

  // How many times is a coach selected as favorite
  static async favoriteCoaches() {
    try {
      const coach = await Team.aggregate([
        {
          $lookup: {
            from: "coaches",
            localField: "favorite_coach",
            foreignField: "_id",
            as: "favoriteCoach",
          },
        },
        {
          $unwind: "$favoriteCoach",
        },
        {
          $group: {
            _id: "$favoriteCoach.coach_name",
            selected: { $sum: 1 },
          },
        },
        {
          $project: {
            coach: "$_id",
            selected: 1,
            _id: 0,
          },
        },
      ]);
      return coach;
    } catch (error) {
      throw error;
    }
  }

  // Commission earned by each agent
  static async totalCommissionOfEachAgentOfAllTime(query?: RequestQuery) {
    try {
      const page = (query?.page as number) || 1;
      const limit = (query?.limit as number) || 100;
      const skipCount = (page - 1) * limit;
      const agentsCommission = await Commission.aggregate([
        {
          $group: {
            _id: "$agent_id",
            totalCommission: { $sum: "$amount" },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "agent",
          },
        },
        {
          $unwind: "$agent",
        },
        {
          $project: {
            _id: 0,
            totalCommission: 1,
            first_name: "$agent.first_name",
            last_name: "$agent.last_name",
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: limit,
        },
      ]);
      return agentsCommission;
    } catch (error) {
      throw error;
    }
  }

  // Commission of all agent in a year
  static async commissionOfEachAgentInYear(query?: RequestQuery) {
    try {
      const givenYear = (query?.year as number) + 1;
      const nextYear = new Date(`${givenYear + 1}`);
      const agentsCommission = await Commission.aggregate([
        {
          $match: {
            createdAt: {
              $gte: givenYear,
              $lt: nextYear,
            },
          },
        },
        {
          $group: {
            _id: "agent_id",
            totalCommission: { $sum: "$amount" },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "agent",
          },
        },
        {
          $project: {
            _id: 0,
            totalCommission: 1,
            firstName: "$agent.first_name",
            lastName: "$agent.last_name",
          },
        },
      ]);
      return agentsCommission;
    } catch (error) {
      throw error;
    }
  }

  // Commission earned at specific month
  static async commissionOfAgentsAtEachMonth() {
    try {
      const commission = await Commission.aggregate([
        //
      ]);
    } catch (error) {
      throw error;
    }
  }
}
