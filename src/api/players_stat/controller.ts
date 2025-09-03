import PlayerStat from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import GameWeek from "../game_week/dal";
import calculate_points from "./utils/calculate_points";
import { IPlayerStat } from "./dto";
import FantasyRoaster from "../fantasy_roaster/dal";
import { IFantasyRoasterPlayer } from "../fantasy_roaster/dto";

// Create player stat for a gameweek
export const createPlayerStat: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { gameweekid } = <PlayerStatRequest.ICreatePlayerStat>req.value;

    // Get a game week
    const gameWeek = await GameWeek.getGameWeekById(gameweekid);
    if (!gameWeek)
      return next(
        new AppError("There is no game week with the specified ID", 404)
      );

    // Get player stats
    const stat = await GameWeek.getPlayerStat(gameWeek._id);
    if (!stat) return next(new AppError("Can not fetch playes' stat", 404));

    // Active roaster
    const activeRoaster = await FantasyRoaster.getFantasyRoaster();
    if (activeRoaster.length === 0)
      return next(new AppError("There is no active roaster", 404));

    // Players from Roaster
    const roasterPlayers = activeRoaster[0].players;

    // Roaster Obj
    let roasterObj: Partial<{ [key: string]: IFantasyRoasterPlayer }> = {};
    roasterPlayers.forEach((player) => {
      roasterObj[player.pid] = player;
    });

    // Update stat

    // Fetched stat
    const fetchedStat = JSON.parse(stat);
    fetchedStat.forEach((stat: any) => {
      if (roasterObj[stat.pid]) {
        stat.role = roasterObj[stat.pid]?.role;
      }
    });

    // Calculate fantasy points based on the stat
    const playerStat = await calculate_points(fetchedStat);

    // Check if the players has team name and role
    const validPlayerStat: IPlayerStat[] = [];
    playerStat.forEach((player: IPlayerStat) => {
      if (player.tname && player.position) {
        validPlayerStat.push(player);
      }
    });

    // Create
    const newPlayerStat = await PlayerStat.createPlayerStat({
      gameweekid: gameWeek._id,
      players: validPlayerStat,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player stat is successfully created",
      data: {
        playerStat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get player stat by id
export const getPlayerStatById: RequestHandler = async (req, res, next) => {
  try {
    const playerStat = await PlayerStat.getPlayerStatById(req.params.id);
    if (!playerStat)
      return next(
        new AppError("There is no player stat with the specified id", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESSS",
      data: {
        playerStat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get player stat by game week id
export const getPlayerStatByGameweek: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const playerStat = await PlayerStat.getPlayerStatByGameweek(
      req.params.gameweekid
    );
    if (!playerStat)
      return next(
        new AppError(
          "There is no player stat with the specified game week",
          404
        )
      );

    // Respond
    res.status(200).json({
      status: "SUCCESSS",
      results: playerStat.players.length,
      data: {
        playerStat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all time player stat
export const getAllTimePlayerStat: RequestHandler = async (req, res, next) => {
  try {
    const playerStat = await PlayerStat.getAllTimePlayerStat();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        playerStat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a player stat
export const deletePlayerStat: RequestHandler = async (req, res, next) => {
  try {
    const playerStat = await PlayerStat.deletePlayerStat(req.params.id);
    if (!playerStat)
      return next(
        new AppError("There is no player stat with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player stat is successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Update players position and point
export const updatePosAndPoint: RequestHandler = async (req, res, next) => {
  try {
    // Check player stat exists
    const playerStatInDB = await PlayerStat.getPlayerStatById(req.params.id);
    if (!playerStatInDB)
      return next(new AppError("Player stat does not exist", 404));

    // Incoming data
    const data = <PlayerStatRequest.IUpdatePosAndPoint>req.value;
    const playersInStatDB = playerStatInDB.players;

    // Filter player by pid
    const playerToBeUpdated = playersInStatDB.find((player) => {
      return player.pid === data.pid;
    });
    if (!playerToBeUpdated)
      return next(new AppError("Player does not exist", 404));

    if (data.position) {
      playerToBeUpdated.position = data.position;
    }

    if (data.fantasy_point) {
      playerToBeUpdated.fantasy_point = data.fantasy_point;
    }

    if (data.goalscored) {
      playerToBeUpdated.goalscored = data.goalscored;
    }

    await playerStatInDB.save();
    // Update player position and point
    const playerStat = await PlayerStat.updatePosAndPoint(
      req.params.id,
      playersInStatDB
    );
    if (!playerStat)
      return next(
        new AppError("Failed to update player position and point", 400)
      );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Player position and/or point updated successfully",
      data: { playerStat },
    });
  } catch (error) {
    next(error);
  }
};
