import { Router } from "express";
import {
  createFeedbackTitle,
  deleteFeedbackTitle,
  getAll,
  getAllActiveTitles,
  getById,
  updateFeedbackTitle,
  changeFeedbackTitleStatus,
  deleteAllFeedbackTitles,
} from "./controller";

import validator from "../../utils/validator";
import {
  createFeedbackTitleValidation,
  updateFeedbackTitleValidation,
  updateFeedbackTitleStatusValidation,
  deleteAllFeedbackTitlesValidation,
} from "./validation";

//Auth
import auth from "../../utils/auth";

//Protect
import protect from "../../utils/protect";

const router = Router();

router.get("/all", protect, auth("Super-admin", "Admin"), getAll);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin", "Admin"),
    validator(createFeedbackTitleValidation),
    createFeedbackTitle
  )
  .get(getAllActiveTitles)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllFeedbackTitlesValidation),
    deleteAllFeedbackTitles
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getById)
  .patch(
    protect,
    auth("Super-admin", "Admin"),
    validator(updateFeedbackTitleValidation),
    updateFeedbackTitle
  )
  .delete(protect, auth("Super-admin", "Admin"), deleteFeedbackTitle);

router.patch(
  "/:id/status",
  protect,
  auth("Super-admin", "Admin"),
  validator(updateFeedbackTitleStatusValidation),
  changeFeedbackTitleStatus
);

// Export router
export default router;
