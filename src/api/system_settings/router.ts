import { Router } from "express";
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import {
  getSystemSettings,
  updateSystemSettings,
  resetToDefaultSettings,
  getPointSystem,
  updatePointSystem,
} from "./controller.js";
import {
  updateSystemSettingsValidator,
  updatePointSystemValidator,
} from "./validator.js";

const router = Router();

// Get system settings
router.get("/", protect, auth("Super-admin"), getSystemSettings);

// Update system settings
router.patch(
  "/",
  protect,
  auth("Super-admin"),
  validator(updateSystemSettingsValidator),
  updateSystemSettings
);

// Reset to default settings
router.post("/reset", protect, auth("Super-admin"), resetToDefaultSettings);

// Get point system
router.get("/point-system", protect, auth("Super-admin"), getPointSystem);

// Update point system
router.patch(
  "/point-system",
  protect,
  auth("Super-admin"),
  validator(updatePointSystemValidator),
  updatePointSystem
);

export default router;
