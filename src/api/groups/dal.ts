import Groups from "./model";
import IGroupDoc from "./dto";
import AppError from "../../utils/app_error";
import Client from "../client/dal";
import mongoose from "mongoose";
import GameWeekTeam from "../game_week_team/model";

export default class Group {
  // Create a new group
  static async createGroup(data: GroupRequest.ICreateGroup, ownerId: string): Promise<IGroupDoc> {
    try {
      const group = await Groups.create({
        ...data,
        owner: ownerId,
        members: [ownerId], // Owner is automatically a member
      });
      return group;
    } catch (error) {
      throw error;
    }
  }

  // Get group by ID
  static async getGroupById(id: string): Promise<IGroupDoc | null> {
    try {
      const group = await Groups.findById(id)
        .populate('owner', 'first_name last_name email')
        .populate('members', 'first_name last_name email')
        .populate('competition', 'competition_name');
      return group;
    } catch (error) {
      throw error;
    }
  }

  // Get group by code
  static async getGroupByCode(code: string): Promise<IGroupDoc | null> {
    try {
      const group = await Groups.findOne({ code: code.toUpperCase() })
        .populate('owner', 'first_name last_name email')
        .populate('members', 'first_name last_name email')
        .populate('competition', 'competition_name');
      return group;
    } catch (error) {
      throw error;
    }
  }

  // Get group by join code
  static async getGroupByJoinCode(joinCode: string): Promise<IGroupDoc | null> {
    try {
      const group = await Groups.findOne({ join_code: joinCode.toUpperCase() })
        .populate('owner', 'first_name last_name email')
        .populate('members', 'first_name last_name email')
        .populate('competition', 'competition_name');
      return group;
    } catch (error) {
      throw error;
    }
  }

  // Get user's groups
  static async getUserGroups(userId: string): Promise<IGroupDoc[]> {
    try {
      const groups = await Groups.find({
        $or: [
          { owner: userId },
          { members: userId }
        ],
        status: 'active'
      })
        .populate('owner', 'first_name last_name email')
        .populate('members', 'first_name last_name email')
        .populate('competition', 'competition_name')
        .sort({ created_at: -1 });
      return groups;
    } catch (error) {
      throw error;
    }
  }

  // Search public groups
  static async searchGroups(query: string, page: number = 1, limit: number = 10): Promise<{ groups: IGroupDoc[], total: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const filter = {
        status: 'active',
        is_public: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      const [groups, total] = await Promise.all([
        Groups.find(filter)
          .populate('owner', 'first_name last_name email')
          .populate('members', 'first_name last_name email')
          .populate('competition', 'competition_name')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit),
        Groups.countDocuments(filter)
      ]);

      return { groups, total };
    } catch (error) {
      throw error;
    }
  }

  // Join group
  static async joinGroup(groupId: string, userId: string): Promise<IGroupDoc | null> {
    try {
      const group = await Groups.findById(groupId);
      if (!group) {
        throw new AppError("Group not found", 404);
      }

      if (group.members.includes(userId as any)) {
        throw new AppError("User is already a member of this group", 400);
      }

      if (group.members.length >= group.max_members) {
        throw new AppError("Group is full", 400);
      }

      if (group.status !== 'active') {
        throw new AppError("Group is not active", 400);
      }

      group.members.push(userId as any);
      await group.save();

      return await this.getGroupById(groupId);
    } catch (error) {
      throw error;
    }
  }

  // Leave group
  static async leaveGroup(groupId: string, userId: string): Promise<IGroupDoc | null> {
    try {
      const group = await Groups.findById(groupId);
      if (!group) {
        throw new AppError("Group not found", 404);
      }

      if (group.owner.toString() === userId) {
        throw new AppError("Group owner cannot leave the group. Transfer ownership or delete the group instead.", 400);
      }

      if (!group.members.includes(userId as any)) {
        throw new AppError("User is not a member of this group", 400);
      }

      group.members = group.members.filter(member => member.toString() !== userId);
      await group.save();

      return await this.getGroupById(groupId);
    } catch (error) {
      throw error;
    }
  }

  // Remove member (owner only)
  static async removeMember(groupId: string, memberId: string, ownerId: string): Promise<IGroupDoc | null> {
    try {
      const group = await Groups.findById(groupId);
      if (!group) {
        throw new AppError("Group not found", 404);
      }

      if (group.owner.toString() !== ownerId) {
        throw new AppError("Only group owner can remove members", 403);
      }

      if (memberId === ownerId) {
        throw new AppError("Group owner cannot remove themselves", 400);
      }

      if (!group.members.includes(memberId as any)) {
        throw new AppError("User is not a member of this group", 400);
      }

      group.members = group.members.filter(member => member.toString() !== memberId);
      await group.save();

      return await this.getGroupById(groupId);
    } catch (error) {
      throw error;
    }
  }

  // Update group
  static async updateGroup(groupId: string, data: GroupRequest.IUpdateGroup, userId: string): Promise<IGroupDoc | null> {
    try {
      const group = await Groups.findById(groupId);
      if (!group) {
        throw new AppError("Group not found", 404);
      }

      if (group.owner.toString() !== userId) {
        throw new AppError("Only group owner can update the group", 403);
      }

      // Update fields
      if (data.name) group.name = data.name;
      if (data.description !== undefined) group.description = data.description;
      if (data.max_members) group.max_members = data.max_members;
      if (data.is_public !== undefined) group.is_public = data.is_public;
      if (data.status) group.status = data.status;

      await group.save();

      return await this.getGroupById(groupId);
    } catch (error) {
      throw error;
    }
  }

  // Delete group
  static async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const group = await Groups.findById(groupId);
      if (!group) {
        throw new AppError("Group not found", 404);
      }

      if (group.owner.toString() !== userId) {
        throw new AppError("Only group owner can delete the group", 403);
      }

      await Groups.findByIdAndDelete(groupId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get group leaderboard (for a specific gameweek)
  static async getGroupLeaderboard(groupId: string, gameWeekId?: string, month?: string): Promise<any[]> {
    try {
      const group = await Groups.findById(groupId);
      if (!group) {
        throw new AppError("Group not found", 404);
      }

      // Get member IDs
      const memberIds = group.members.map((member: any) => member._id);

      if (gameWeekId && mongoose.Types.ObjectId.isValid(gameWeekId)) {
        // For weekly leaderboard - get real points from GameWeekTeam
        
        // Validate ObjectIds before using them
        const validMemberIds = memberIds.filter((id: any) => mongoose.Types.ObjectId.isValid(id));
        
        if (validMemberIds.length === 0) {
          return [];
        }
        
        // Get all gameweek teams for this gameweek that belong to group members
        const gameWeekTeams = await GameWeekTeam.aggregate([
          {
            $match: {
              game_week_id: new mongoose.Types.ObjectId(gameWeekId),
              client_id: { $in: validMemberIds.map((id: any) => new mongoose.Types.ObjectId(id)) }
            }
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
                  $project: { first_name: 1, last_name: 1, full_name: 1, id: 1, profile_picture: 1 },
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
            $project: {
              client_id: 1,
              team_id: 1,
              total_fantasy_point: 1,
              rank: 1,
            },
          },
        ]);

        // For weekly leaderboard - return structure similar to main leaderboard
        // First, get all group members
        const allGroupMembers = await Groups.findById(groupId).populate('members', 'first_name last_name profile_picture');
        if (!allGroupMembers) {
          throw new AppError("Group not found", 404);
        }

        // Create a map of existing gameweek teams for quick lookup
        const gameweekTeamMap = new Map();
        gameWeekTeams.forEach((team: any) => {
          gameweekTeamMap.set(team.client_id.id.toString(), team);
        });

        // Create leaderboard with all group members
        const leaderboard = allGroupMembers.members.map((member: any, index: number) => {
          const gameweekTeam = gameweekTeamMap.get(member._id.toString());
          if (gameweekTeam) {
            // Member has a gameweek team
            return {
              _id: gameweekTeam._id,
              client_id: {
                id: gameweekTeam.client_id.id,
                first_name: gameweekTeam.client_id.first_name,
                last_name: gameweekTeam.client_id.last_name,
                profile_picture: gameweekTeam.client_id.profile_picture || "",
              },
              total_fantasy_point: gameweekTeam.total_fantasy_point || 0,
              rank: gameweekTeam.rank,
            };
          } else {
            // Member doesn't have a gameweek team - add with 0 points
            return {
              _id: member._id,
              client_id: {
                id: member._id,
                first_name: member.first_name,
                last_name: member.last_name,
                profile_picture: member.profile_picture || "",
              },
              total_fantasy_point: 0,
              rank: gameWeekTeams.length + index + 1, // Rank after those with points
            };
          }
        });

        // Sort by total_fantasy_point descending, then by rank
        leaderboard.sort((a: any, b: any) => {
          if (b.total_fantasy_point !== a.total_fantasy_point) {
            return b.total_fantasy_point - a.total_fantasy_point;
          }
          return a.rank - b.rank;
        });

        // Reassign ranks after sorting
        leaderboard.forEach((item: any, index: number) => {
          item.rank = index + 1;
        });

        return leaderboard;
      } else if (month) {
        // For monthly leaderboard - get real points from GameWeekTeam
        const GameWeekDAL = require("../game_week/dal").default;
        
        // Validate ObjectIds before using them
        const validMemberIds = memberIds.filter((id: any) => mongoose.Types.ObjectId.isValid(id));
        
        if (validMemberIds.length === 0) {
          return [];
        }
        
        // Get all game_weeks in the selected month
        const gameWeeksInMonth = await GameWeekDAL.getGameWeeksInMonth(month);
        
        if (gameWeeksInMonth.length === 0) {
          return [];
        }
        
        // Get monthly leaderboard for group members
        const monthlyLeaderboard = await GameWeekTeam.aggregate([
          {
            $match: { 
              game_week_id: { $in: gameWeeksInMonth },
              client_id: { $in: validMemberIds.map((id: any) => new mongoose.Types.ObjectId(id)) }
            },
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
                  $project: { first_name: 1, last_name: 1, full_name: 1, id: 1, profile_picture: 1 },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "teams",
              localField: "_id",
              foreignField: "client_id",
              as: "team_id",
              pipeline: [
                {
                  $project: { team_name: 1 },
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
        ]);

        // For monthly leaderboard - return structure similar to main monthly leaderboard
        // First, get all group members
        const allGroupMembers = await Groups.findById(groupId).populate('members', 'first_name last_name');
        if (!allGroupMembers) {
          throw new AppError("Group not found", 404);
        }

        // Create a map of existing monthly teams for quick lookup
        const monthlyTeamMap = new Map();
        monthlyLeaderboard.forEach((team: any) => {
          monthlyTeamMap.set(team._id.toString(), team);
        });

        // Create leaderboard with all group members
        const leaderboard = allGroupMembers.members.map((member: any, index: number) => {
          const monthlyTeam = monthlyTeamMap.get(member._id.toString());
          if (monthlyTeam) {
            // Member has monthly data
            return {
              _id: monthlyTeam._id,
              client_id: {
                first_name: monthlyTeam.client_id.first_name,
                last_name: monthlyTeam.client_id.last_name,
              },
              total_fantasy_point: monthlyTeam.total_fantasy_point || 0,
              rank: monthlyTeam.rank,
            };
          } else {
            // Member doesn't have monthly data - add with 0 points
            return {
              _id: member._id,
              client_id: {
                first_name: member.first_name,
                last_name: member.last_name,
              },
              total_fantasy_point: 0,
              rank: monthlyLeaderboard.length + index + 1, // Rank after those with points
            };
          }
        });

        // Sort by total_fantasy_point descending, then by rank
        leaderboard.sort((a: any, b: any) => {
          if (b.total_fantasy_point !== a.total_fantasy_point) {
            return b.total_fantasy_point - a.total_fantasy_point;
          }
          return a.rank - b.rank;
        });

        // Reassign ranks after sorting
        leaderboard.forEach((item: any, index: number) => {
          item.rank = index + 1;
        });

        return leaderboard;
      } else {
        // For yearly - calculate total points for all gameweeks in current year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        // Get all group members
        const allGroupMembers = await Groups.findById(groupId).populate('members', 'first_name last_name email profile_picture');
        if (!allGroupMembers) {
          throw new AppError("Group not found", 404);
        }

        // Calculate yearly points for each member
        const yearlyLeaderboard = await Promise.all(
          allGroupMembers.members.map(async (member: any) => {
            // Get all gameweek teams for this member in the current year
            const yearlyTeams = await GameWeekTeam.aggregate([
              {
                $match: {
                  client_id: new mongoose.Types.ObjectId(member._id),
                  created_at: {
                    $gte: startOfYear,
                    $lte: endOfYear
                  }
                }
              },
              {
                $group: {
                  _id: "$client_id",
                  total_fantasy_point: { $sum: "$total_fantasy_point" },
                  total_games: { $sum: 1 }
                }
              }
            ]);

            const totalPoints = yearlyTeams.length > 0 ? yearlyTeams[0].total_fantasy_point : 0;
            const totalGames = yearlyTeams.length > 0 ? yearlyTeams[0].total_games : 0;

            return {
              _id: member._id,
              name: `${member.first_name} ${member.last_name}`,
              email: member.email || "",
              profile_picture: member.profile_picture || "",
              total_points: totalPoints,
              total_games: totalGames,
              team_name: "Team", // Could be enhanced to get actual team name
            };
          })
        );

        // Sort by total points (descending) and assign ranks
        yearlyLeaderboard.sort((a: any, b: any) => {
          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points;
          }
          return a.name.localeCompare(b.name); // Alphabetical tiebreaker
        });

        // Assign ranks
        yearlyLeaderboard.forEach((member: any, index: number) => {
          member.rank = index + 1;
        });

        return yearlyLeaderboard;
      }
    } catch (error) {
      throw error;
    }
  }

  // Add members to group
  static async addMembersToGroup(groupId: string, memberIds: string[], currentUserId: string): Promise<IGroupDoc> {
    try {
      const group = await Groups.findById(groupId);
      if (!group) {
        throw new AppError("Group not found", 404);
      }

      // Check if current user is the owner
      if (group.owner.toString() !== currentUserId) {
        throw new AppError("Only group owner can add members", 403);
      }

      // Check if group has space for new members
      const currentMemberCount = group.members.length;
      const newMemberCount = currentMemberCount + memberIds.length;
      if (newMemberCount > group.max_members) {
        throw new AppError(`Group can only have ${group.max_members} members`, 400);
      }

      // Add new members (avoid duplicates)
      const existingMemberIds = group.members.map(member => member.toString());
      const newMembers = memberIds.filter(id => !existingMemberIds.includes(id));
      
      if (newMembers.length === 0) {
        throw new AppError("All selected users are already members of this group", 400);
      }

      group.members.push(...newMembers);
      await group.save();

      // Add group to each new member's groups array
      await Client.addGroupToClients(newMembers, groupId);

      return group;
    } catch (error) {
      throw error;
    }
  }
}
