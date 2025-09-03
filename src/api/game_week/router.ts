import Router from "express";
const router = Router();
import validator from "../../utils/validator";
import {
  createGameWeekValidator,
  createDoubleGameWeekValidator,
  updateStatusValidator,
  updateGameWeekValidator,
  updateGameWeekToFreeValidator,
  updateGameWeekToDoneValidator,
  deleteAllValidator,
  addMatchIdValidation,
  createGameWeekManualValidation,
  validateDeadlinesAPI,
} from "./validation";
import {
  createGameWeek,
  createDoubleGameWeek,
  createGameWeekManual,
  fetchPlayerStat,
  getPlayerStat,
  deleteAllGameWeeks,
  deleteGameWeekById,
  getAllGameWeeks,
  getGameWeekById,
  getLiveGameWeek,
  updateGameWeek,
  updateGameWeekToFree,
  updateToDone,
  updateStatus,
  updateGameWeekIntervalTime,
  addMatchId,
  updateDeadlines,
  triggerAutoJoin,
  getAutoJoinStatus,
  rescheduleAutoJoinJobs,
} from "./controller";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

// Mount routes with handler methods

router.get(
  "/active",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getLiveGameWeek
);

router.post(
  "/double",
  protect,
  auth("Super-admin"),
  validator(createDoubleGameWeekValidator),
  createDoubleGameWeek
);

router.post(
  "/manual",
  protect,
  auth("Super-admin"),
  validator(createGameWeekManualValidation),
  createGameWeekManual
);

router.patch(
  "/:id/deadline",
  protect,
  auth("Super-admin"),
  validator(validateDeadlinesAPI),
  updateDeadlines
);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createGameWeekValidator),
    createGameWeek
  )
  .get(getAllGameWeeks)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllValidator),
    deleteAllGameWeeks
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getGameWeekById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updateGameWeekValidator),
    updateGameWeek
  )
  .delete(protect, auth("Super-admin"), deleteGameWeekById);

router.get("/:id/fetchplayerstat", fetchPlayerStat);
router.get("/:id/playerstat", getPlayerStat);

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin"),
  validator(updateStatusValidator),
  updateStatus
);

router.patch(
  "/free/:id",
  protect,
  auth("Super-admin"),
  validator(updateGameWeekToFreeValidator),
  updateGameWeekToFree
);

router.patch(
  "/done/:id",
  protect,
  auth("Super-admin"),
  validator(updateGameWeekToDoneValidator),
  updateToDone
);

router.patch(
  "/:id/timeinterval",
  protect,
  auth("Super-admin"),
  updateGameWeekIntervalTime
);

router.patch(
  "/:id/matchid",
  protect,
  auth("Super-admin"),
  validator(addMatchIdValidation),
  addMatchId
);

// Auto-join routes
router.post(
  "/:id/auto-join",
  protect,
  auth("Super-admin"),
  triggerAutoJoin
);

router.get(
  "/auto-join/status",
  protect,
  auth("Super-admin"),
  getAutoJoinStatus
);

router.post(
  "/auto-join/reschedule",
  protect,
  auth("Super-admin"),
  rescheduleAutoJoinJobs
);

// Export router
export default router;
