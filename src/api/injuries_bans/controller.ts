import InjuriesBan from "./dal";
import FantasyRoaster from "../fantasy_roaster/dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import configs from "../../configs";

// Create injuries and bans
export const createInjuriesBan: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { player, state, injury_title, chance } = <
      InjuriesBanRequest.ICreateInjuryBan
    >req.value;

    // Create
    const injuriesBan = await InjuriesBan.createInjuriesBan({
      player,
      state,
      injury_title,
      chance,
    });

    // Update the roaster
    if (injuriesBan) {
      if (state === "Injury") {
        await FantasyRoaster.updateInjuryBanStatus({
          pid: player.pid,
          is_injuried: true,
        });
      } else if (state === "Ban") {
        await FantasyRoaster.updateInjuryBanStatus({
          pid: player.pid,
          is_banned: true,
        });
      }
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Injuries and bans successfully created for the player",
      data: {
        injuriesBan,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all injuries and bans
export const getAllInjuriesAndBans: RequestHandler = async (req, res, next) => {
  try {
    const injuriesBans = await InjuriesBan.getAllInjuriesBan();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: injuriesBans.length,
      data: {
        injuriesBans,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get latest injuries and bans
export const getLatestInjuriesBans: RequestHandler = async (req, res, next) => {
  try {
    const injuriesBans = await InjuriesBan.getAllLatestInjuriesBans();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: injuriesBans.length,
      data: {
        injuriesBans,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get injury and ban
export const getInjuryBanById: RequestHandler = async (req, res, next) => {
  try {
    const injuryBan = await InjuriesBan.getInjuryBanById(req.params.id);
    if (!injuryBan)
      return next(
        new AppError("There is no injury or ban with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        injuryBan,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update injury and ban
export const updateInjuryBan: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { state, chance, injury_title } = <
      InjuriesBanRequest.IUpdateInjuryBan
    >req.value;

    // Get Injury or Ban
    const injuriesBan = await InjuriesBan.getInjuryBanById(req.params.id);
    if (!injuriesBan)
      return next(
        new AppError("There is no injury or ban with the specified ID", 404)
      );

    // Update
    const updatedInjuryBan = await InjuriesBan.updateInjuryBan({
      id: req.params.id,
      state,
      chance,
      injury_title,
    });

    // Update the roaster
    if (updatedInjuryBan) {
      if (state === "Injury") {
        await FantasyRoaster.updateInjuryBanStatus({
          pid: injuriesBan.player.pid,
          is_injuried: true,
        });
      } else if (state === "Ban") {
        await FantasyRoaster.updateInjuryBanStatus({
          pid: injuriesBan.player.pid,
          is_banned: true,
        });
      }
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Injury and ban successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Delete an injury and ban
export const deleteInjuryBan: RequestHandler = async (req, res, next) => {
  try {
    const injuryBan = await InjuriesBan.deleteInjuryBan(req.params.id);
    if (!injuryBan)
      return next(
        new AppError("There is no Injury or ban with the specified ID", 404)
      );

    if (injuryBan.state === "Injury") {
      await FantasyRoaster.updateInjuryBanStatus({
        pid: injuryBan.player.pid,
        is_injuried: false,
      });
    } else if (injuryBan.state === "Ban") {
      await FantasyRoaster.updateInjuryBanStatus({
        pid: injuryBan.player.pid,
        is_banned: false,
      });
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Injury and ban successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all injuries and bans
export const deleteAllInjuriesBans: RequestHandler = async (req, res, next) => {
  try {
    // Get delete key
    const { delete_key } = <AdminRequest.IDeleteAllAdmins>req.value;

    // Check the validity of the delete key
    if (configs.delete_key !== delete_key)
      return next(new AppError("Invalid delete key", 401));

    // Delete
    await InjuriesBan.deleteAllInjuriesBans();

    // Reset Injury, and Ban status of the players in the fantasy roaster
    await FantasyRoaster.resetInjuryBanStatus();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "All injuries and bans successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};
