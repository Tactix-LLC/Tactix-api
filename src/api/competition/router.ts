import { Router } from "express";
const router = Router();
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validate from "../../utils/validator";
import {
  createCompetitionValidator,
  updateCompetitionStatusValidator,
  updateCompetitionValidator,
  deleteAllComeptitionsValidator,
} from "./validation";
import {
  createCompetition,
  deleteAllCompetitions,
  deleteCompetition,
  getAllCompetitions,
  getCompetition,
  updateCompStatus,
  updateCompetition,
  getCompsBySeason,
  getBySlug,
} from "./controller";

router
  .route("/")
  .post(
    validate(createCompetitionValidator),
    protect,
    auth("Super-admin"),
    createCompetition
  )
  .get(protect, getAllCompetitions)
  .delete(
    protect,
    auth("Super-admin"),
    validate(deleteAllComeptitionsValidator),
    deleteAllCompetitions
  );

router.get("/getbyslug", protect, auth("Super-admin"), getBySlug);

router
  .route("/:id")
  .get(protect, getCompetition)
  .patch(
    protect,
    auth("Super-admin"),
    validate(updateCompetitionValidator),
    updateCompetition
  )
  .delete(protect, auth("Super-admin"), deleteCompetition);

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin"),
  validate(updateCompetitionStatusValidator),
  updateCompStatus
);

router.get("/season/:season_id", getCompsBySeason);
// Export router
export default router;
