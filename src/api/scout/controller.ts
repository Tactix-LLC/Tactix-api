import { RequestHandler } from "express";

//DAL
import Scout from "./dal";

//Error
import AppError from "../../utils/app_error";

//Interfaces
import IClientDoc from "../client/dto";

// Add player
export const createScout: RequestHandler = async (req, res, next) => {
  try {
    // Request body
    const input = <ScoutRequest.ICreateScoutInput>req.value;
    const user = <IClientDoc>req.user;

    //get player by its id that was saved from entity sports
    const existinglayer = await Scout.checkPlayerExists({
      client_id: user._id,
      player_id: input.playerId,
    });

    if (existinglayer) {
      return next(new AppError("player is already added.", 400));
    }

    //organize the data to saved
    const data: {
      player_id: string;
      client_id: string;
      player_name: string;
      position: string;
      team: string;
      player_number: string;
      club_logo: string;
    } = {
      player_id: input.playerId,
      client_id: user.id,
      player_name: input.player_name,
      position: input.position,
      team: input.team,
      player_number: input.player_number,
      club_logo: input.club_logo,
    };

    // Insert scout content
    const player = await Scout.AddPlayer(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Player Added to watch list successfully!",
      data: {
        player,
      },
    });
  } catch (error: any) {
    if (error.response) {
      next(new AppError(error.response.data.response, error.response.status));
    } else {
      next(error);
    }
  }
};

// remove player from watch list
export const removePlayer: RequestHandler = async (req, res, next) => {
  try {
    const playerId = req.params.playerid;

    const user = <IClientDoc>req.user;

    const player = await Scout.checkPlayerExists({
      client_id: user.id,
      player_id: playerId,
    });

    if (!player) {
      return next(
        new AppError("No player found, please use the approprate url", 404)
      );
    }

    await Scout.removePlayerByPlayerId({
      client_id: user.id,
      player_id: playerId,
    });

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Player successfuly removed from watch list",
    });
  } catch (error) {
    next(error);
  }
};

// Get watch listed players
export const getWatchlistedPlayers: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;

    //get the current client watch listed players
    const players = await Scout.getPlayerByClientId(user.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: players.length,
      data: {
        players,
      },
    });
  } catch (error) {
    next(error);
  }
};
