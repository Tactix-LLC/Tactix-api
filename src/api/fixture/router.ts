import Router from "express";
const router = Router();

import protect from "../../utils/protect";
import auth from "../../utils/auth";
import {
  getActiveFixtures,
  proxyMatchInfo,
  proxyMatchStats,
  proxyStandings,
} from "./controller";

// Active game week fixtures (all match_ids, including DGW matches)
router.get(
  "/matches",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getActiveFixtures
);

// Match info proxy
router.get(
  "/matches/:matchId/info",
  protect,
  auth("Super-admin", "Admin", "Client"),
  proxyMatchInfo
);

// Match stats proxy
router.get(
  "/matches/:matchId/stats",
  protect,
  auth("Super-admin", "Admin", "Client"),
  proxyMatchStats
);

// Standings proxy
router.get(
  "/standings",
  protect,
  auth("Super-admin", "Admin", "Client"),
  proxyStandings
);

export default router;
