import { Router } from "express";
const router = Router();
import {
  createTermsValidation,
  updateTermsValidation,
  updateTermsStatusValidation,
  deleteAllTermsValidation,
} from "./validation";
import {
  createTerms,
  deleteAllTerms,
  deleteTermById,
  getAllPublishedTerms,
  getAllTerms,
  getTermById,
  updateTermsDetail,
  updatePublishedStatus,
} from "./controller";
import validator from "../../utils/validator";
import auth from "../../utils/auth";
import protect from "../../utils/protect";

router.get("/all", protect, auth("Super-admin", "Admin"), getAllTerms);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createTermsValidation),
    createTerms
  )
  .get(getAllPublishedTerms)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllTermsValidation),
    deleteAllTerms
  );

router
  .route("/:id")
  .get(getTermById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updateTermsValidation),
    updateTermsDetail
  )
  .delete(protect, auth("Super-admin"), deleteTermById);

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin"),
  validator(updateTermsStatusValidation),
  updatePublishedStatus
);

export default router;
