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
  getPlayerStatByGameweek,
  getPlayerStatById,
  getAllTimePlayerStat,
  deletePlayerStat,
  updatePosAndPoint,
} from "./controller";

router.get(
  "/all",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getAllTimePlayerStat
);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createPlayerStatValidation),
    createPlayerStat
  );

router
  .route("/:id")
  .get(getPlayerStatById)
  .delete(protect, auth("Super-admin"), deletePlayerStat);

router.get("/:gameweekid/gameweek", getPlayerStatByGameweek);

router.patch(
  "/:id/positionandpoint",
  protect,
  auth("Super-admin"),
  validator(validateUpdatePlayerStat),
  updatePosAndPoint
);

// Export router
export default router;
