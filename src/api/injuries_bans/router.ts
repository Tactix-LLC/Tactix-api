import Router from "express";
const router = Router();
import validator from "../../utils/validator";

import {
  createInjuriesBan,
  getAllInjuriesAndBans,
  getLatestInjuriesBans,
  getInjuryBanById,
  updateInjuryBan,
  deleteInjuryBan,
  deleteAllInjuriesBans,
} from "./controller";

import {
  createInjuriesBansValidation,
  updateInjuryBanValidation,
  deleteInjuriesBansValidation,
} from "./validation";

import protect from "../../utils/protect";
import auth from "../../utils/auth";

router.get(
  "/all",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getAllInjuriesAndBans
);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createInjuriesBansValidation),
    createInjuriesBan
  )
  .get(protect, auth("Super-admin", "Admin", "Client"), getLatestInjuriesBans)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteInjuriesBansValidation),
    deleteAllInjuriesBans
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin", "Client"), getInjuryBanById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updateInjuryBanValidation),
    updateInjuryBan
  )
  .delete(protect, auth("Super-admin"), deleteInjuryBan);

// Export router
export default router;
