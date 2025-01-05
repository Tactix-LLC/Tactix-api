import Router from "express";
const router = Router();
import validator from "../../utils/validator";
import {
  createWinnersValidator,
  updateIsCreditValidator,
  updatePrizeValidator,
} from "./validation";
import {
  createWinner,
  getAllWinners,
  getWeeklyWinners,
  getYearlyWinners,
  updateWinnerPrize,
  getClientAwards,
  deleteWinner,
  deleteAllWinners,
  getMonthlyWinners,
  approveWinner,
  updateIsCredit,
} from "./controller";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

// Mount routes with controller methods
router
  .route("/")
  .post(
    protect,
    auth("Super-admin", "Admin"),
    validator(createWinnersValidator),
    createWinner
  )
  .get(protect, auth("Super-admin", "Admin"), getAllWinners)
  .delete(protect, auth("Super-admin"), deleteAllWinners);

router
  .route("/weekly/:gameWeekId")
  .get(protect, auth("Super-admin", "Admin", "Client"), getWeeklyWinners);

router.get(
  "/monthly",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getMonthlyWinners
);

router
  .route("/yearly")
  .get(protect, auth("Super-admin", "Admin", "Client"), getYearlyWinners);

router.delete("/:winnerId", protect, auth("Super-admin"), deleteWinner);

router.patch(
  "/updateprize/:winnerId",
  protect,
  auth("Super-admin"),
  validator(updatePrizeValidator),
  updateWinnerPrize
);

router.get(
  "/clientawards/:clientId",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getClientAwards
);

router.patch(
  "/iscredit/:winnerId",
  protect,
  auth("Super-admin"),
  validator(updateIsCreditValidator),
  updateIsCredit
);

router.patch("/approval/:id", protect, auth("Super-admin"), approveWinner);

// Export router
export default router;
