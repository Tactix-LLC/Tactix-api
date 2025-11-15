import Router from "express";
const router = Router();
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import { validateDeleteAllAPI } from "./validation";
import {
  deleteAllGameWeekTeam,
  deleteGameWeekTeam,
  getAllGameWeekTeams,
  getClientGameWeekTeams,
  getClientGameWeeks,
  getByGameWeekByTeamId,
  getByGameWeekAndClientId,
  getClientGameweekTeam,
  getGameWeekTeam,
  checkClientJoinedActiveGameWeek,
  getWeeklyLeaderBoard,
  getClientWeeklyRank,
  getClientYearlyRank,
  getYearlyLeaderboard,
  getWeeklyLeaderBoardWeb,
  getYearlyLeaderboardWeb,
  getByGameWeekId,
  getMonthlyLeaderBoard,
  getClientMonthlyRank,
  countClientsInGameWeek,
  getPlayerSelectionStat,
  getPlayerSelectionStatGameWeek,
  getClientsNotJoinedGamweek,
  agentJoinedGameweek,
  getPhoneNumbersOfClients,
  adminJoinUserToGameWeek,
} from "./controller";

// Mount routes with their respective handler methods in controller
router
  .route("/")
  .get(protect, auth("Super-admin", "Admin"), getAllGameWeekTeams)
  .delete(
    protect,
    auth("Super-admin"),
    validator(validateDeleteAllAPI),
    deleteAllGameWeekTeam
  );

router.get("/joined", protect, auth("Client"), getClientGameWeekTeams);

router.get(
  "/selectionstat",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getPlayerSelectionStat
);

router.get(
  "/agents",
  protect,
  auth("Super-admin", "Admin"),
  agentJoinedGameweek
);

router.get(
  "/phonenumbers",
  protect,
  auth("Super-admin", "Admin"),
  getPhoneNumbersOfClients
);

router.get(
  "/weeklyleaderboard/:gameWeekId",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getWeeklyLeaderBoard
);

router.get(
  "/weeklyrank/:gameWeekId/:client_id",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getClientWeeklyRank
);

router.get(
  "/monthlyleaderboard",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getMonthlyLeaderBoard
);

router.get(
  "/monthlyrank/:client_id",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getClientMonthlyRank
);

router.get(
  "/yearlyleaderboard",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getYearlyLeaderboard
);

router.get(
  "/yearlyrank/:client_id",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getClientYearlyRank
);

router.get("/weeklyleaderboardweb/:gameWeekId", getWeeklyLeaderBoardWeb);

router.get("/yearlyleaderboardweb", getYearlyLeaderboardWeb);

router.get(
  "/clientgameweeks/:clientId",
  protect,
  auth("Super-admin", "Admin"),
  getClientGameWeeks
);

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin", "Client"), getGameWeekTeam)
  .delete(protect, auth("Super-admin"), deleteGameWeekTeam);

router.get(
  "/joined/activegameweek",
  protect,
  auth("Client"),
  checkClientJoinedActiveGameWeek
);

router.get(
  "/phonenumbers",
  protect,
  auth("Super-admin", "Admin"),
  getPhoneNumbersOfClients
);

router.get("/gameweek/all/:gameweekid", protect, getByGameWeekId);

router.get(
  "/gameweek/count/:gameweekid",
  protect,
  auth("Super-admin", "Admin"),
  countClientsInGameWeek
);

router.get(
  "/gameweek/:gameweekid",
  protect,
  auth("Client"),
  getByGameWeekAndClientId
);

router.get(
  "/:gameweekId/clientsnotjoined",
  protect,
  getClientsNotJoinedGamweek
);

router.get("/team/:teamid", protect, auth("Client"), getByGameWeekByTeamId);

router.get("/:game_week_id/:client_id/clientgameweek", getClientGameweekTeam);

router.get(
  "/:game_week_id/selectionstat",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getPlayerSelectionStatGameWeek
);

// Admin: Join user to active game week
router.post(
  "/admin/join/:client_id",
  protect,
  auth("Super-admin", "Admin"),
  adminJoinUserToGameWeek
);

// Export router
export default router;
