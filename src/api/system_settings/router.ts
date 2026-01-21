import { Router } from "express";
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import {
  getPublicAppStatus,
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

// Public app status (no auth) - used by mobile app to decide whether to show season break screen
router.get("/app-status", getPublicAppStatus);

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
