import { Router } from "express";
import {
  createSeason,
  updateSeason,
  getAll,
  getEverySeason,
  getById,
  updateStatus,
  deleteAllSeasons,
} from "./controller";
import validate from "../../utils/validator";
import {
  createSeasonValidation,
  updateSeasonValidation,
  updateSeasonStatusValidation,
  deleteAllSeasonsValidation,
} from "./validation";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

const router = Router();

router.get("/all", protect, auth("Super-admin"), getEverySeason);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validate(createSeasonValidation),
    createSeason
  )
  .get(getAll)
  .delete(
    protect,
    auth("Super-admin"),
    validate(deleteAllSeasonsValidation),
    deleteAllSeasons
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin"), getById)
  .patch(
    protect,
    auth("Super-admin"),
    validate(updateSeasonValidation),
    updateSeason
  );

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin"),
  validate(updateSeasonStatusValidation),
  updateStatus
);

// Export router
export default router;
