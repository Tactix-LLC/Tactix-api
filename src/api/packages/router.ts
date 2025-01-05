import Router from "express";
const router = Router();

import protect from "../../utils/protect";
import auth from "../../utils/auth";

// Validators
import validator from "../../utils/validator";

// Validations
import {
  createNewPackageValidation,
  updatePackageStatusValidation,
  deleteAllPackagesValidation,
} from "./validation";

// Controllers
import {
  createNewPackage,
  getAllPackages,
  getActivePackages,
  getPackage,
  updatePackageStatus,
  deletePackage,
  deleteAllPackages,
} from "./controller";

router.get(
  "/active",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getActivePackages
);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createNewPackageValidation),
    createNewPackage
  )
  .get(protect, auth("Super-admin", "Admin"), getAllPackages, getPackage)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllPackagesValidation),
    deleteAllPackages
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getPackage)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updatePackageStatusValidation),
    updatePackageStatus
  )
  .delete(protect, auth("Super-admin"), deletePackage);

// Export router
export default router;
