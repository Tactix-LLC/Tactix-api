import { Router } from "express";
import * as autoJoinLogController from "./controller";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

const router = Router();

// Get all auto-join logs (admin only)
router.get(
  "/",
  protect,
  auth("Super-admin"),
  autoJoinLogController.getAllAutoJoinLogs
);

// Get auto-join statistics (admin only)
router.get(
  "/statistics",
  protect,
  auth("Super-admin"),
  autoJoinLogController.getAutoJoinStatistics
);

// Get auto-join logs for a specific game week (admin only)
router.get(
  "/game-week/:gameWeekId",
  protect,
  auth("Super-admin"),
  autoJoinLogController.getAutoJoinLogsByGameWeek
);

// Get auto-join log by ID (admin only)
router.get(
  "/:id",
  protect,
  auth("Super-admin"),
  autoJoinLogController.getAutoJoinLogById
);

// Delete old auto-join logs (admin only)
router.delete(
  "/cleanup",
  protect,
  auth("Super-admin"),
  autoJoinLogController.deleteOldAutoJoinLogs
);

export default router;

