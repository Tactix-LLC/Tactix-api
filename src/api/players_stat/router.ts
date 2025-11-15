import Router from "express";
const router = Router();
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import {
  createPlayerStatValidation,
  validateUpdatePlayerStat,
} from "./validation";
import {
  createPlayerStat,
  getAllPlayerStats,
  getAggregatedPlayerStats,
  getPlayerStatsByGameWeek,
  updatePlayerStat,
  bulkUpdatePlayerStats,
  recalculateGameWeekPoints,
  recalculateTeamPointsForGameWeek,
  generatePlayerStats,
} from "./controller";

router.get(
  "/all",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getAllPlayerStats
);

// New route for aggregated player stats (for mobile app)
router.get(
  "/aggregated",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getAggregatedPlayerStats
);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createPlayerStatValidation),
    createPlayerStat
  );


router.get("/:gameweekid/gameweek", getPlayerStatsByGameWeek);


// New admin routes for player point editing
router.get(
  "/admin/all",
  protect,
  auth("Super-admin", "Admin"),
  getAllPlayerStats
);

router.get(
  "/admin/gameweek/:gameWeekId",
  protect,
  auth("Super-admin", "Admin"),
  getPlayerStatsByGameWeek
);

router.post(
  "/admin/gameweek/:gameWeekId/generate",
  protect,
  auth("Super-admin", "Admin"),
  generatePlayerStats
);

router.put(
  "/admin/gameweek/:gameWeekId/player/:playerId",
  protect,
  auth("Super-admin", "Admin"),
  updatePlayerStat
);

router.put(
  "/admin/gameweek/:gameWeekId/bulk",
  protect,
  auth("Super-admin", "Admin"),
  bulkUpdatePlayerStats
);

router.post(
  "/admin/gameweek/:gameWeekId/recalculate",
  protect,
  auth("Super-admin"),
  recalculateGameWeekPoints
);

router.post(
  "/admin/gameweek/:gameWeekId/recalculate-teams",
  protect,
  auth("Super-admin", "Admin"),
  recalculateTeamPointsForGameWeek
);

// Export router
export default router;
