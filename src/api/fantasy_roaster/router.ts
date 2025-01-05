import { Router } from "express";
const router: Router = Router();

// Controllers
import {
  createFantasyRoaster,
  getActiveRoaster,
  getAllRoasters,
  getFantasyRoaster,
  updatePlayerRating,
  updateRoasterStatus,
  deleteAllRoasters,
  deleteRoaster,
  updateTransferRadar,
  removePlayer,
  addPlayer,
  updatePlayerTeam,
} from "./controller";

// Validations
import {
  updateRoasterValidation,
  updatePlayerRatingValidaton,
  deleteAllRoastersValidation,
  updateTransferRadarValidation,
  removePlayerValidation,
  addPlayerValidation,
  updatePlayerTeamValidation,
} from "./validation";

// Protect
import protect from "../../utils/protect";

// Auth
import auth from "../../utils/auth";

// Validator
import validator from "../../utils/validator";

router.get("/all", protect, auth("Super-admin", "Admin"), getAllRoasters);

router
  .route("/")
  .post(protect, auth("Super-admin"), createFantasyRoaster)
  .get(getActiveRoaster)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllRoastersValidation),
    deleteAllRoasters
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getFantasyRoaster)
  .delete(protect, auth("Super-admin"), deleteRoaster);

router.patch(
  "/:id/status",
  protect,
  auth("Super-admin"),
  validator(updateRoasterValidation),
  updateRoasterStatus
);

router.patch(
  "/:id/price",
  protect,
  auth("Super-admin"),
  validator(updatePlayerRatingValidaton),
  updatePlayerRating
);

router.patch(
  "/:id/transfer",
  protect,
  auth("Super-admin"),
  validator(updateTransferRadarValidation),
  updateTransferRadar
);

router.patch(
  "/:id/removeplayer",
  protect,
  auth("Super-admin"),
  validator(removePlayerValidation),
  removePlayer
);

router.patch(
  "/:id/addplayer",
  protect,
  auth("Super-admin"),
  validator(addPlayerValidation),
  addPlayer
);

router.patch(
  "/:id/team",
  protect,
  auth("Super-admin"),
  validator(updatePlayerTeamValidation),
  updatePlayerTeam
);

export default router;
