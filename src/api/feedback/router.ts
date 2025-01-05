import { Router } from "express";

//controllers
import {
  createFeedback,
  deleteFeedback,
  getAll,
  getById,
  deleteAllFeedbacks,
} from "./controller";

//validator
import validator from "../../utils/validator";
import {
  createFeedbackValidation,
  deleteAllFeedbacksValidation,
} from "./validation";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

const router = Router();

router
  .route("/")
  .post(validator(createFeedbackValidation), createFeedback)
  .get(protect, auth("Super-admin", "Admin"), getAll)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllFeedbacksValidation),
    deleteAllFeedbacks
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getById)
  .delete(protect, auth("Super-admin", "Admin"), deleteFeedback);

// Export router
export default router;
