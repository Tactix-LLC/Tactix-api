import { RequestHandler } from "express";
import Season from "./dal";
import ISeasonDoc from "./dto";
import AppError from "../../utils/app_error";
import Competition from "../competition/dal";
import axios from "axios";
import configs from "../../configs";

// Create season
export const createSeason: RequestHandler = async (req, res, next) => {
  try {
    // Check if there's an existing season in DB
    const seasonInDB = await Season.getEverySeason();
    if (seasonInDB.length > 0) {
      return next(
        new AppError(
          "There is one season in DB. You can not create more than one season",
          400
        )
      );
    }
    // Request body
    const data = <SeasonRequest.ICreateSeasonInput>req.value;

    //Fetch season from entity sports
    const seasonsFromEntitySport = await axios.get(
      `${configs.entity_sport.url}/seasons?token=${configs.entity_sport.token}`
    );

    // Check if season name exists from entity sports response
    let foundSeason: string | undefined = undefined;
    seasonsFromEntitySport.data.response.items.forEach((season: any) => {
      if (season.name === data.name) {
        foundSeason = season.sid;
      }
    });

    if (!foundSeason) {
      return next(
        new AppError("No season found with the name you provided.", 404)
      );
    }

    // Insert Season
    const season: ISeasonDoc = await Season.createSeason({
      name: data.name,
      season_id: foundSeason,
    });

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "New Season created successfully",
      data: {
        season,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all
export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const season = await Season.getAll();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: season.length,
      data: {
        season,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all
export const getEverySeason: RequestHandler = async (req, res, next) => {
  try {
    const season = await Season.getEverySeason();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: season.length,
      data: {
        season,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find by id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    // Find and check if it exists
    const season = await Season.getById(req.params.id);
    if (!season) return next(new AppError("Season not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        season,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Season
export const updateSeason: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <SeasonRequest.IUpdateSeasonInput>req.value;

    // Find season in DB - will be used to get competitions under it
    const seasonInDB = await Season.getById(req.params.id);
    if (!seasonInDB) {
      return next(new AppError("No season found.", 404));
    }

    //Fetch season from entity sports
    const seasonsFromEntitySport = await axios(
      `${configs.entity_sport.url}/seasons/?token=${configs.entity_sport.token}`
    );

    //check if season name exists from entity sports response
    let foundSeason: string | undefined = undefined;
    seasonsFromEntitySport.data.response.items.forEach((season: any) => {
      if (season.name === data.name) {
        foundSeason = season.sid;
      }
    });

    // Check season exist in entity sport
    if (!foundSeason) {
      return next(new AppError("Season does not exist.", 404));
    }

    // Update Season and return null if document is not found
    const season = await Season.updateSeason({
      name: data.name,
      season_id: foundSeason,
      id: req.params.id,
    });

    await Competition.updateSidOfAllCompetitions(
      req.params.id,
      seasonInDB.season_id as string
    );

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Season updated successfully",
      data: { season },
    });
  } catch (error) {
    next(error);
  }
};

// Update status
export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <SeasonRequest.IUpdateSeasonStatusInput>req.value;

    // Update season. Also check if the dal method returns null
    const season = await Season.updateStatus({
      is_active: data.is_active,
      id: req.params.id,
    });

    if (!data) return next(new AppError("Season not found", 404));

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Status of season updated successfully",
      data: { season },
    });
  } catch (error) {
    next(error);
  }
};

// Delete all seasons
export const deleteAllSeasons: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { delete_key } = <SeasonRequest.IDeleteAllSeasonInput>req.value;

    // Check delete key
    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // Delete
    await Season.deleteAllSeasons();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All seasons deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
