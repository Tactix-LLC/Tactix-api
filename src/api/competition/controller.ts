import Competition from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import Season from "../season/dal";
import slugify from "slugify";
import configs from "../../configs";
import axios from "axios";

// Create comp test
export const createCompetition: RequestHandler = async (req, res, next) => {
  try {
    const reqBody = <CompetitionRequest.ICreateCompetitionInput>req.value;

    // Check season exists
    const season = await Season.getById(reqBody.season);
    if (!season) return next(new AppError("Unknown season selected", 404));

    // Check competition exists in the selected season
    const seasonFromEntitySport = await axios.get(
      `${configs.entity_sport.url}/season/${season.season_id}/competitions?token=${configs.entity_sport.token}`
    );

    // Competitions in season
    const competetionsInEntitySport = seasonFromEntitySport.data.response
      .items as Array<any>;

    if (
      !competetionsInEntitySport.some(
        (competition) => competition.cid === reqBody.cid
      )
    ) {
      return next(
        new AppError("Competition does not exist in the selected season", 400)
      );
    }

    // Fetch comeptition from entity sport
    const compInfo = await axios(
      `${configs.entity_sport.url}/competition/${reqBody.cid}?token=${configs.entity_sport.token}`
    );

    // Extract competition info object
    const data = compInfo.data.response.items[0];

    // Check competition exists indb
    if (Object.keys(data).length === 0) {
      return next(new AppError("Competition not found", 404));
    }

    // Check competition is not completed (unless allow_completed=true is passed)
    const allowCompleted = req.query.allow_completed === 'true';
    if (parseInt(data.status) === 2 && !allowCompleted)
      return next(
        new AppError(
          "You can not create a competition that is already completed",
          400
        )
      );

    // Slugify competition name
    const competition_slug = slugify(data.cname, "_");

    // Extract necessary info from "data"
    const necessaryInfo = {
      competition_name: data.cname,
      competition_slug,
      cid: data.cid,
      sid: season.season_id,
      season: season.id,
      logo: data.logo,
      start_date: data.startdate,
      end_date: data.enddate,
      status: data.status,
    };

    // Create competition
    const competition = await Competition.createComp(necessaryInfo);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "New competition created successfully",
      data: { competition },
    });
  } catch (error: any) {
    if (error.response) {
      next(new AppError(error.response.data.response, error.response.status));
    } else {
      next(error);
    }
  }
};

// Get competition by season id
export const getCompsBySeason: RequestHandler = async (req, res, next) => {
  try {
    // Find competitions by season
    const competetions = await Competition.getCompsBySeason(
      req.params.season_id
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: competetions.length,
      data: { competetions },
    });
  } catch (error) {
    next(error);
  }
};

// Get all competitions
export const getAllCompetitions: RequestHandler = async (req, res, next) => {
  try {
    const competetions = await Competition.getAllCompetitions();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: competetions.length,
      data: { competetions },
    });
  } catch (error) {
    next(error);
  }
};

// Get a competition
export const getCompetition: RequestHandler = async (req, res, next) => {
  try {
    const competition = await Competition.getCompetition(req.params.id);
    if (!competition) return next(new AppError("Competition not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { competition },
    });
  } catch (error) {
    next(error);
  }
};

// Update competition
export const updateCompetition: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    const reqBody = <CompetitionRequest.IUpdateCompetitionInput>req.value;

    // Fetch comeptition from entity sport
    const compInfo = await axios(
      `${configs.entity_sport.url}/competition/${reqBody.cid}?token=${configs.entity_sport.token}`
    );

    // Extract competition info object
    const data = compInfo.data.response.items[0];

    // Check competition exists indb
    if (!data) {
      return next(new AppError("Competition not found", 404));
    }

    // Check competition is not completed
    if (parseInt(data.status) === 2)
      return next(
        new AppError(
          "You can not use a competition that is already completed",
          400
        )
      );

    // Slugify competition name
    const competition_slug = slugify(data.cname, "_");

    // Extract necessary info from "data"
    const dataForDAL = {
      competition_name: data.cname as string,
      competition_slug,
      cid: reqBody.cid,
      logo: data.logo as string,
      start_date: data.startdate as Date,
      end_date: data.enddate as Date,
    };

    // Update competition
    const competition = await Competition.updateCompetition(id, dataForDAL);
    if (!competition) return next(new AppError("Competition not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Competition updated successfully",
      data: { competition },
    });
  } catch (error: any) {
    if (error.response) {
      next(new AppError(error.response.data.response, error.response.status));
    } else {
      next(error);
    }
  }
};

// Update competition status
export const updateCompStatus: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = <CompetitionRequest.IUpdateCompetitionStatusInput>req.value;

    // Update competition status
    const competition = await Competition.updateCompStatus(id, data);
    if (!competition) return next(new AppError("Competition not found", 404));

    // Game week status will be updated here.

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Competition status updated successfully",
      data: { competition },
    });
  } catch (error) {
    next(error);
  }
};

// Delete competition
export const deleteCompetition: RequestHandler = async (req, res, next) => {
  try {
    // Check if there're game weeks created under the competition. If so restrict deletion

    // Delete competition
    const competition = await Competition.deleteCompetition(req.params.id);
    if (!competition) {
      return next(new AppError("Competition does not exist", 404));
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Competition deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all competitions
export const deleteAllCompetitions: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { delete_key } = <CompetitionRequest.IDeleteAllCompetitionsInput>(
      req.value
    );

    // Check delete key
    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // Check game weeks before deleting all competitions

    // Delete all competitions
    await Competition.deleteAllComps();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All competitions deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get competition by competition slug
export const getBySlug: RequestHandler = async (req, res, next) => {
  try {
    // Check slug is provided
    if (!req.query.slug) return next(new AppError("Slug is required", 400));

    const competition = await Competition.getBySlug(req.query.slug as string);
    if (!competition) return next(new AppError("Competition not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { competition },
    });
  } catch (error) {
    next(error);
  }
};
