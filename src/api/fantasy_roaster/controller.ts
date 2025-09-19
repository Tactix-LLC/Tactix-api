import { NextFunction, Request, RequestHandler, Response } from "express";

import Season from "../season/dal";
import Competition from "../competition/dal";
import FantasyRoaster from "./dal";

import AppError from "../../utils/app_error";
import configs from "../../configs";

import IFantasyRoasterDoc, { IPlayer } from "./dto";

// Get all players from Entity Sport and Check if there are new players
export const createFantasyRoaster: RequestHandler = async (req, res, next) => {
  try {
    // Check if there is an active roaster before creating a new one
    const activeRoaster = await FantasyRoaster.getFantasyRoaster();
    if (activeRoaster.length !== 0)
      return next(
        new AppError(
          "There is an active fantasy roaster. You can create a new one when the current roaster is inactive",
          400
        )
      );

    // Get the selected season and competition
    const { season_id, competition_id } = req.body;
    if (!season_id) {
      return next(new AppError("Season ID is required", 400));
    }
    if (!competition_id) {
      return next(new AppError("Competition ID is required", 400));
    }
    
    const season = await Season.getById(season_id);
    if (!season)
      return next(new AppError("Season not found", 404));
    
    const competition = await Competition.getCompetition(competition_id);
    if (!competition)
      return next(new AppError("Competition not found", 404));
    
    const season_name = season.name;
    const competition_cid = competition.cid;

    // Instead of using game week matches, let's create an empty roaster
    // Users can populate players separately using the populate-players endpoint
    const allPlayers: IPlayer[] = [];

    // Create fantasy roaster with empty players array
    // Players can be populated later using the populate-players endpoint
    const fantasyRoaster = await FantasyRoaster.createFantasyRoaster({
      season_name,
      season_id,
      competition_id,
      competition_cid,
      players: allPlayers, // Empty array
    });

    // Cache Roaster
    await FantasyRoaster.cacheActiveRoaster(fantasyRoaster);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Fantasy roaster created successfully. Use the populate-players endpoint to add players.",
      data: {
        fantasyRoaster,
        totalPlayers: 0,
        note: "Roaster created empty. Use populate-players endpoint to add players from the selected competition."
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get active fantasy roaster
export const getActiveRoaster: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activeRoaster = await FantasyRoaster.getFantasyRoaster();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: activeRoaster.length,
      data: {
        fantasyRoaster: activeRoaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all roasters
export const getAllRoasters: RequestHandler = async (req, res, next) => {
  try {
    const roasters = await FantasyRoaster.getEveryFantasyRoaster();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: roasters.length,
      data: {
        fantasyRoasters: roasters,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single roaster
export const getFantasyRoaster: RequestHandler = async (req, res, next) => {
  try {
    const roaster = await FantasyRoaster.getSingleRoaster(req.params.id);
    if (!roaster)
      return next(
        new AppError("There is no fantasy roaster with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        fantasyRoaster: roaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add Player
export const addPlayer: RequestHandler = async (req, res, next) => {
  try {
    // Get  body
    const { pid, pname, rating, role, tid, tname, logo, fullname, abbr } = <
      FantasyRoasterRequest.IAddPlayer
    >req.value;

    // Add player
    const roaster = await FantasyRoaster.addPlayer({
      id: req.params.id,
      pid,
      pname,
      rating,
      role,
      tid,
      logo,
      tname,
      fullname,
      abbr,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player added successfully into the roaster",
    });
  } catch (error) {
    next(error);
  }
};

// Update player rating
export const updatePlayerRating: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { pid, rating } = <FantasyRoasterRequest.IUpdatePlayerRating>(
      req.value
    );

    // Update
    const fantasyRoaster = await FantasyRoaster.updatePlayerPrice({
      pid,
      rating,
      id: req.params.id,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player price or rating successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Update player's team
export const updatePlayerTeam: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { pid, team } = <FantasyRoasterRequest.IUpdatePlayerTeam>req.value;

    // Update
    const fantasyRoaster = await FantasyRoaster.updatePlayerTeam({
      id: req.params.id,
      pid,
      team,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player's team successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Update Transfer Radar
export const updateTransferRadar: RequestHandler = async (req, res, next) => {
  try {
    const { pid, transfer_radar } = <
      FantasyRoasterRequest.IUpdateTransferRadar
    >req.value;

    // Update
    const fantasyRoaster = await FantasyRoaster.updateTransferRadar({
      pid,
      transfer_radar,
      id: req.params.id,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player transfer radar is successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Update roaster status
export const updateRoasterStatus: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { is_active } = <FantasyRoasterRequest.IUpdateRoasterStatusInput>(
      req.value
    );

    // Update
    const roaster = await FantasyRoaster.updateRoasterStatus({
      id: req.params.id,
      is_active,
    });
    if (!roaster)
      return next(
        new AppError("There is no fantasy roaster with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Fantasy roaster status is successfully updated",
      data: {
        fantasyRoaster: roaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove a player from roaster
export const removePlayer: RequestHandler = async (req, res, next) => {
  try {
    const { pid } = <FantasyRoasterRequest.IRemovePlayer>req.value;

    // Remove
    const roaster = await FantasyRoaster.removePlayer(req.params.id, pid);
    if (!roaster)
      return next(
        new AppError("Player does not exists with the specified ID", 404)
      );
    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player is successfully removed from the roaster",
    });
  } catch (error) {
    next(error);
  }
};

// Delete a roaster
export const deleteRoaster: RequestHandler = async (req, res, next) => {
  try {
    // Get the roaster
    const roaster = await FantasyRoaster.getSingleRoaster(req.params.id);
    if (!roaster)
      return next(
        new AppError("There is no fantasy roaster with the specified ID", 404)
      );

    // Check if the roaster is active
    if (roaster.is_active)
      return next(
        new AppError(
          "The roaster is active. You can not delete an active roaster",
          400
        )
      );

    // Delete roaster
    await FantasyRoaster.deleteRoaster(req.params.id);

    // Delete cahced roaster
    await FantasyRoaster.deleteCachedRoaster(roaster.season_name);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Fantasy roaster is successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all roasters
export const deleteAllRoasters: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { delete_key } = <FantasyRoasterRequest.IDeleteRoastersInput>(
      req.value
    );

    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // Delete all
    await FantasyRoaster.deleteRoasters();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "All fantasy roasters are deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
