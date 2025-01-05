import Router from "express";
const router = Router();
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import {
  validateCreateAPI,
  validateDeleteAll,
  validateUpdateAPI,
} from "./validation";
import {
  createCompany,
  deleteAll,
  deleteById,
  getAllAdCompanies,
  getById,
  updateCompanyInfo,
} from "./controller";

// Mount routes with their respective  controller methods
router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(validateCreateAPI),
    createCompany
  )
  .get(protect, auth("Super-admin", "Admin"), getAllAdCompanies)
  .delete(
    protect,
    auth("Super-admin"),
    validator(validateDeleteAll),
    deleteAll
  );

router
  .route("/:id")
  .get(protect, getById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(validateUpdateAPI),
    updateCompanyInfo
  )
  .delete(protect, auth("Super-admin"), deleteById);

// Export
export default router;
