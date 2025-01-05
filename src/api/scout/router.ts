import { Router } from "express";
import { createScout, removePlayer, getWatchlistedPlayers } from "./controller";

import validate from "../../utils/validator";
import { createScoutValidation } from "./validation";

import protect from "../../utils/protect";
import auth from "../../utils/auth";

const router = Router();

router
  .route("/")
  .post(protect, auth("Client"), validate(createScoutValidation), createScout)
  .get(protect, auth("Client"), getWatchlistedPlayers);

router.delete("/:playerid", protect, auth("Client"), removePlayer);

// Export router
export default router;
