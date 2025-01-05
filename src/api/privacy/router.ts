import { Router } from "express";

//controllers
import {
  createPrivacy,
  getPrivacyById,
  updatePublishedStatus,
  updateSinglePrivacy,
  deletePrivacy,
  deletePrivacies,
  getPrivacies,
  getAllPrivacies,
} from "./controller";

//validation
import {
  createPrivacyValidation,
  updatePrivacyValidation,
  updateStatusValidation,
  deleteAllPrivaciesValidation,
} from "./validation";

import validator from "../../utils/validator";
import auth from "../../utils/auth";
import protect from "../../utils/protect";

const router: Router = Router();

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createPrivacyValidation),
    createPrivacy
  )
  .get(getPrivacies)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllPrivaciesValidation),
    deletePrivacies
  );

router.get("/all", protect, auth("Super-admin", "Admin"), getAllPrivacies);

router
  .route("/:id")
  .get(getPrivacyById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updatePrivacyValidation),
    updateSinglePrivacy
  )
  .delete(protect, auth("Super-admin"), deletePrivacy);

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin", "Admin"),
  validator(updateStatusValidation),
  updatePublishedStatus
);

export default router;
