import { Router } from "express";
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validate from "../../utils/validator";
import { createFavoriteValidation } from "./validation";
import { createFavorite, getFavoritePlayers, removePlayer } from "./controller";

const router = Router();

router
  .route("/")
  .post(
    protect,
    auth("Client"),
    validate(createFavoriteValidation),
    createFavorite
  )
  .get(protect, auth("Client"), getFavoritePlayers);

  router.delete("/:playerid", protect, auth("Client"), removePlayer);

  // Export router
  export default router;
