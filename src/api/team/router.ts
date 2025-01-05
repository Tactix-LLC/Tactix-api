import Router from "express";
const router = Router();
import validator from "../../utils/validator";
import {
  teamNameAvailability,
  createTeam,
  deleteAllTeams,
  deleteClientTeam,
  deleteTeam,
  getAllTeams,
  getByNameForClient,
  getClientTeam,
  getTeamByIdForAdmin,
  getTeamByClientID,
  refereshPoints,
  updateTeamDetail,
  switchPlayers,
  transferPlayer,
  changeCaptainViceCaptain,
  updateBudget,
  updateAllTeamsBudget,
  updateFavoriteCoach,
  updateFavoriteTactic,
  updateTeamProfile,
  resetTeam,
  recreateteam,
} from "./controller";
import {
  createTeamValidator,
  updateTeamValidator,
  validateChangeCaptainAPI,
  validateSwitchPlayers,
  validateTransferPlayer,
  updateBudgetValidation,
  updateFavoriteCoachValidation,
  updateFavoriteTacticValidation,
  updateTeamProfileValidation,
  validateRecreateTeam,
} from "./validation";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

// Mount routes to their controller method
router
  .route("/")
  .post(protect, auth("Client"), validator(createTeamValidator), createTeam)
  .get(protect, auth("Super-admin", "Admin"), getAllTeams)
  .delete(protect, auth("Super-admin"), deleteAllTeams);

router.get("/clientteam", protect, auth("Client"), getClientTeam);

router.get("/refresh", protect, auth("Client"), refereshPoints);

router.patch("/resetteam", protect, auth("Client"), resetTeam);

router.patch(
  "/recreateteam",
  protect,
  auth("Client"),
  validator(validateRecreateTeam),
  recreateteam
);

router.patch(
  "/allteamsbudget",
  protect,
  auth("Super-admin"),
  updateAllTeamsBudget
);

router
  .route("/:id")
  .delete(protect, auth("Client"), deleteClientTeam)
  .patch(
    protect,
    auth("Client"),
    validator(updateTeamValidator),
    updateTeamDetail
  );

router.get(
  "/getbyname/:teamname/:id",
  protect,
  auth("Client"),
  getByNameForClient
);

router.patch(
  "/switchplayers/:playerId",
  protect,
  auth("Client"),
  validator(validateSwitchPlayers),
  switchPlayers
);

router.patch(
  "/transferplayer/:playerId",
  protect,
  auth("Client"),
  validator(validateTransferPlayer),
  transferPlayer
);

// Check team nama is available(not taken)
router.get(
  "/checkteamname/:teamname",
  protect,
  auth("Client"),
  teamNameAvailability
);

router
  .route("/admin/:teamId")
  .get(protect, auth("Super-admin", "Admin", "Client"), getTeamByIdForAdmin)
  .delete(protect, auth("Super-admin"), deleteTeam);

router.patch(
  "/swapcaptains/:captainorvice",
  protect,
  auth("Client"),
  validator(validateChangeCaptainAPI),
  changeCaptainViceCaptain
);

router.patch(
  "/:id/budget",
  protect,
  auth("Super-admin"),
  validator(updateBudgetValidation),
  updateBudget
);

router.get(
  "/:client_id/clientteam",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getTeamByClientID
);

router.patch(
  "/:id/favoritecoach",
  protect,
  auth("Client"),
  validator(updateFavoriteCoachValidation),
  updateFavoriteCoach
);

router.patch(
  "/:id/favoritetactic",
  protect,
  auth("Client"),
  validator(updateFavoriteTacticValidation),
  updateFavoriteTactic
);

router.patch(
  "/:id/profile",
  protect,
  auth("Client"),
  validator(updateTeamProfileValidation),
  updateTeamProfile
);

// Export the router
export default router;
