//Express
import { Router } from "express";
const router = Router();

//Auth
import protect from "../../utils/protect";
import auth from "../../utils/auth";

// validation
import {
  createCoachValidator,
  updateCoachInfoValidator,
  updateCoachImageValidator,
  updateCoachStatusValidator,
  swapMajorCoachesValidator,
  deleteAllCoachsValidator,
} from "./validation";

import validate from "../../utils/validator";

//controller
import {
  createCoach,
  deleteAllCoaches,
  deleteCoach,
  getCoach,
  getCoachByName,
  getCoaches,
  getAllCoaches,
  swapMajorCoach,
  updateCoach,
  updateCoachImage,
  updateCoachStatus,
} from "./controller";

router.get("/all", protect, auth("Super-admin", "Admin"), getAllCoaches);

router.patch(
  "/swap",
  protect,
  auth("Super-admin"),
  validate(swapMajorCoachesValidator),
  swapMajorCoach
);

router
  .route("/")
  .post(
    validate(createCoachValidator),
    protect,
    auth("Super-admin"),
    createCoach
  )
  .get(protect, auth("Super-admin", "Admin", "Client"), getCoaches)
  .delete(
    protect,
    auth("Super-admin"),
    validate(deleteAllCoachsValidator),
    deleteAllCoaches
  );

router
  .route("/:id")
  .get(protect, auth("Client", "Super-admin", "Admin"), getCoach)
  .patch(
    protect,
    auth("Super-admin"),
    validate(updateCoachInfoValidator),
    updateCoach
  )
  .delete(protect, auth("Super-admin"), deleteCoach);

router.get(
  "/name/:name",
  protect,
  auth("Client", "Super-admin"),
  getCoachByName
);

router.patch(
  "/status/:id",
  protect,
  auth("Super-admin"),
  validate(updateCoachStatusValidator),
  updateCoachStatus
);

router.patch(
  "/image/:id",
  protect,
  auth("Super-admin"),
  validate(updateCoachImageValidator),
  updateCoachImage
);

// Export router
export default router;
