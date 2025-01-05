import { Router } from "express";
import {
  createAboutUs,
  deleteAboutUs,
  getAll,
  getById,
  getEveryAboutUs,
  updateContent,
  updateStatus,
} from "./controller";
import validator from "../../utils/validator";
import {
  createAboutUsValidation,
  updateAboutUsStatusValidation,
  updateAboutUsValidation,
} from "./validation";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

const router = Router();

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createAboutUsValidation),
    createAboutUs
  )
  .get(getAll);

router.get("/all", protect, auth("Super-admin", "Admin"), getEveryAboutUs);

router
  .route("/:id")
  .get(getById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updateAboutUsValidation),
    updateContent
  )
  .delete(protect, auth("Super-admin"), deleteAboutUs);

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin"),
  validator(updateAboutUsStatusValidation),
  updateStatus
);

// Export router
export default router;
