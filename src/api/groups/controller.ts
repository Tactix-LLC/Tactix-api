import { RequestHandler } from "express";
import Group from "./dal";
import AppError from "../../utils/app_error";
import IClientDoc from "../client/dto";
import Client from "../client/dal";

// Create group
export const createGroup: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const group = await Group.createGroup(req.body as GroupRequest.ICreateGroup, userId);
    
    res.status(201).json({
      status: "SUCCESS",
      message: "Group created successfully",
      data: {
        group,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's groups
export const getUserGroups: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const groups = await Group.getUserGroups(userId);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "User groups retrieved successfully",
      data: {
        groups,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get group by ID
export const getGroupById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await Group.getGroupById(id);
    
    if (!group) {
      return next(new AppError("Group not found", 404));
    }
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Group retrieved successfully",
      data: {
        group,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search groups
export const searchGroups: RequestHandler = async (req, res, next) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query as any;
    const { groups, total } = await Group.searchGroups(query, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Groups search completed",
      data: {
        groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Join group
export const joinGroup: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const { group_id, join_code } = req.value as GroupRequest.IJoinGroup;
    
    let group;
    if (group_id) {
      group = await Group.joinGroup(group_id, userId);
    } else if (join_code) {
      const groupByCode = await Group.getGroupByJoinCode(join_code);
      if (!groupByCode) {
        return next(new AppError("Invalid join code", 404));
      }
      group = await Group.joinGroup(groupByCode._id.toString(), userId);
    } else {
      return next(new AppError("Either group_id or join_code is required", 400));
    }
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Successfully joined group",
      data: {
        group,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Leave group
export const leaveGroup: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const { id } = req.params;
    const group = await Group.leaveGroup(id, userId);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Successfully left group",
      data: {
        group,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove member (owner only)
export const removeMember: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const { id } = req.params;
    const { member_id } = req.value as GroupRequest.IRemoveMember;
    const group = await Group.removeMember(id, member_id, userId);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Member removed successfully",
      data: {
        group,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update group
export const updateGroup: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const { id } = req.params;
    const group = await Group.updateGroup(id, req.value as GroupRequest.IUpdateGroup, userId);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Group updated successfully",
      data: {
        group,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete group
export const deleteGroup: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const { id } = req.params;
    await Group.deleteGroup(id, userId);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get group leaderboard
export const getGroupLeaderboard: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gameweek_id, month } = req.query;
    
    const group = await Group.getGroupById(id);
    if (!group) {
      return next(new AppError("Group not found", 404));
    }

    const leaderboard = await Group.getGroupLeaderboard(id, gameweek_id as string, month as string);
    
    // Determine time period based on parameters
    let timePeriod = "yearly"; // default
    if (gameweek_id) {
      timePeriod = "weekly";
    } else if (month) {
      timePeriod = "monthly";
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Group leaderboard retrieved successfully",
      data: {
        leaderboard: {
          group: group,
          leaderboard: leaderboard,
          my_rank: null, // Will be implemented when user ranking is available
          game_week: gameweek_id,
          month: month,
          has_more: false,
          time_period: timePeriod,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search users for adding to groups
export const searchUsers: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Search query too short",
        data: {
          users: [],
        },
      });
    }

    const users = await Client.searchUsers(query, userId);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Users found successfully",
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add members to group
export const addMembersToGroup: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const userId = user._id.toString();
    const groupId = req.params.id;
    const { member_ids } = req.body;

    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return next(new AppError("Member IDs are required", 400));
    }

    const result = await Group.addMembersToGroup(groupId, member_ids, userId);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Members added to group successfully",
      data: {
        group: result,
      },
    });
  } catch (error) {
    next(error);
  }
};
