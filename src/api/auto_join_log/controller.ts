import { RequestHandler } from "express";
import AutoJoinLogDAL from "./dal";

/**
 * Get all auto-join logs
 */
export const getAllAutoJoinLogs: RequestHandler = async (req, res, next) => {
  try {
    const { game_week_id, trigger_type, status, limit, skip } = req.query;

    const filters = {
      game_week_id: game_week_id as string | undefined,
      trigger_type: trigger_type as "automatic" | "manual" | undefined,
      status: status as "success" | "partial" | "failed" | undefined,
      limit: limit ? parseInt(limit as string) : 100,
      skip: skip ? parseInt(skip as string) : 0,
    };

    const logs = await AutoJoinLogDAL.getAllLogs(filters);

    res.status(200).json({
      status: "SUCCESS",
      results: logs.length,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get auto-join log by ID
 */
export const getAutoJoinLogById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await AutoJoinLogDAL.getLogById(id);

    if (!log) {
      return res.status(404).json({
        status: "FAIL",
        message: "Auto-join log not found",
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      data: { log },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get auto-join logs for a specific game week
 */
export const getAutoJoinLogsByGameWeek: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { gameWeekId } = req.params;

    const logs = await AutoJoinLogDAL.getLogsByGameWeek(gameWeekId);

    res.status(200).json({
      status: "SUCCESS",
      results: logs.length,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get auto-join statistics
 */
export const getAutoJoinStatistics: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const statistics = await AutoJoinLogDAL.getStatistics();

    res.status(200).json({
      status: "SUCCESS",
      data: { statistics },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete old auto-join logs
 */
export const deleteOldAutoJoinLogs: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { daysOld } = req.query;
    const days = parseInt(daysOld as string) || 90; // Default to 90 days

    const deletedCount = await AutoJoinLogDAL.deleteOldLogs(days);

    res.status(200).json({
      status: "SUCCESS",
      message: `Deleted ${deletedCount} old auto-join logs`,
      data: { deletedCount, daysOld: days },
    });
  } catch (error) {
    next(error);
  }
};

