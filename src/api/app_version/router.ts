import Router from "express";
const router = Router();
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import {
  validateCreateAPI,
  validateDeleteAllAPI,
  validateSeverityAPI,
  validateUpdateAPI,
} from "./validation";
import {
  createAppVersion,
  deleteAllVersions,
  deleteVersionById,
  getAllVersions,
  getLatestVersion,
  getVersion,
  updateSeverity,
  updateVersion,
} from "./controller";

// Mount endpoints with their controller methods
router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(validateCreateAPI),
    createAppVersion
  )
  .get(protect, auth("Super-admin", "Admin"), getAllVersions)
  .delete(
    protect,
    auth("Super-admin"),
    validator(validateDeleteAllAPI),
    deleteAllVersions
  );

router.get(
  "/latest",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getLatestVersion
);

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getVersion)
  .patch(
    protect,
    auth("Super-admin"),
    validator(validateUpdateAPI),
    updateVersion
  )
  .delete(protect, auth("Super-admin"), deleteVersionById);

router.patch(
  "/severity/:id",
  protect,
  auth("Super-admin", "Admin"),
  validator(validateSeverityAPI),
  updateSeverity
);

// Export router
export default router;
