//Express
import { Router } from "express";
const router = Router();

//Auth
import protect from "../../utils/protect";
import auth from "../../utils/auth";

// validation
import {
  createPerkValidator,
  deleteAllPerksValidator,
  updatePerkStatusValidator,
  updatePerkValidator,
} from "./validation";
import validate from "../../utils/validator";

//controller
import {
  createPerk,
  deleteAllPerks,
  getPerk,
  getPerks,
  updatePerk,
  updatePerkStatus,
} from "./controller";

router
  .route("/")
  .post(validate(createPerkValidator), protect, auth("Super-admin"), createPerk)
  .get(protect, auth("Super-admin", "Admin", "Client"), getPerks)
  .delete(
    protect,
    auth("Super-admin"),
    validate(deleteAllPerksValidator),
    deleteAllPerks
  );

router
  .route("/:id")
  .get(protect, auth("Client", "Super-admin", "Admin"), getPerk)
  .patch(
    protect,
    auth("Super-admin"),
    validate(updatePerkValidator),
    updatePerk
  );

router
  .route("/:id")
  .get(protect, auth("Client", "Super-admin", "Admin"), getPerk);

router.patch(
  "/updatestatus/:id",
  protect,
  auth("Super-admin"),
  validate(updatePerkStatusValidator),
  updatePerkStatus
);

// Export router
export default router;
