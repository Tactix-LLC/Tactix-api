import { Router } from "express";
const router: Router = Router();

// Controllers
import {
  getClientSignUpInEachMont,
  getClientsJoinedInEachGameWeek,
  getClientsThatPlayedInEachMonth,
  getClientsInPaidAndFreeGameWeeks,
  getAnalytics,
} from "./controller";

// Protect
import protect from "../../utils/protect";

// Auth
import auth from "../../utils/auth";

router.get("/", protect, auth("Super-admin", "Admin"), getAnalytics);

router.get(
  "/clients/gameweek",
  protect,
  auth("Super-admin", "Admin"),
  getClientsJoinedInEachGameWeek
);

router.get(
  "/playedineachmonth",
  protect,
  auth("Super-admin", "Admin"),
  getClientsThatPlayedInEachMonth
);

router.get(
  "/clientsignup",
  protect,
  auth("Super-admin", "Admin"),
  getClientSignUpInEachMont
);

router.get(
  "/clients/freeandpaidgameweeks",
  protect,
  auth("Super-admin", "Admin"),
  getClientsInPaidAndFreeGameWeeks
);

export default router;
