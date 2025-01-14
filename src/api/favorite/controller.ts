import { RequestHandler } from "express";
import IClientDoc from "../client/dto";
import Favorite from "./dal";
import AppError from "../../utils/app_error";

// Add player
export const createFavorite: RequestHandler = async (req, resizeBy, next) => {
  try {
    // Request body
    const input = <FavoriteRequest.ICreateFavoriteInput>req.value;
    const user = <IClientDoc>req.user;

    // get player by its id that was saved from entity sports
    const existingplayer = await Favorite.checkPlayerExists({
      client_id: user._id,
      player_id: input.playerId,
    });

    if (existingplayer) {
      return next(new AppError("player is already added.", 400));
    }

    // organize the data to saved
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

    // Inser favorite data
    const player = await Favorite.AddPlayer(data);

    // Response
    resizeBy.status(201).json({
      status: "SUCCESS",
      message: "Plater Added to favorite list successfully!",
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

// remove player from favorite
export const removePlayer: RequestHandler = async (req, res, next) => {
  try {
    const playerId = req.params.playerid;

    const user = <IClientDoc>req.user;

    const player = await Favorite.checkPlayerExists({
        player_id: playerId,
        client_id: user.id
    });

    if(!player) {
        return next(new AppError("No player found, please use the appropriate url", 404));
    }

    await Favorite.removePlayerByPlayerId({
        player_id: playerId,
        client_id: user.id
    });

    // Response
    res.status(200).json({
        status: "SUCCESS",
        message: "Player successfully removed from favorites"
    });
  } catch (error) {
    next(error);
  }
};

// Get favorite
export const getFavoritePlayers: RequestHandler = async (req, res, next) => {
    try {
        const user = <IClientDoc>req.user;

        // get the current client favorite players
        const players = await Favorite.getPlayerByClientId(user.id);

        // Response
        res.status(200).json({
            status: "SUCCESS",
            results: players.length,
            data: {
                players
            }
        });
    } catch(error) {
        next(error);
    }
}
