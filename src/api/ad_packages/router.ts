import Router from "express";
const router = Router();
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import {
  validateCreateAPI,
  validateDeleteAPI,
  validateStatusAPI,
  validateUpdateAPI,
} from "./validation";
import {
  createAdPackage,
  deleteAllAdPackages,
  deleteById,
  getAllActiveAdPackages,
  getAllAdpackages,
  getById,
  updateAdPackage,
  updateStatus,
} from "./controller";

// Mount the routes with their respective cotnroller methods
router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(validateCreateAPI),
    createAdPackage
  )
  .get(protect, auth("Super-admin", "Admin"), getAllAdpackages)
  .delete(
    protect,
    auth("Super-admin"),
    validator(validateDeleteAPI),
    deleteAllAdPackages
  );

router.get("/active", protect, getAllActiveAdPackages);

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin"),
  validator(validateStatusAPI),
  updateStatus
);

router
  .route("/:id")
  .get(protect, auth("Super-admin"), getById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(validateUpdateAPI),
    updateAdPackage
  )
  .delete(protect, auth("Super-admin"), deleteById);

// Export the router
export default router;
