import { Router } from "express";
import {
  createTransferHistory,
  getTransferHistories,
  getTransferHistory,
  deleteAllTransferHistories,
  deleteTransferHistory,
  getAllTransferHistories,
  transferStat,
} from "./controller";

import validate from "../../utils/validator";
import {
  createTrasnferHistoryValidation,
  deleteAllTranferHistoryValidation,
} from "./validation";

import protect from "../../utils/protect";
import auth from "../../utils/auth";

const router = Router();

router
  .route("/")
  .post(
    protect,
    auth("Client"),
    validate(createTrasnferHistoryValidation),
    createTransferHistory
  )
  .get(protect, auth("Client"), getTransferHistories)
  .delete(
    protect,
    auth("Super-admin"),
    validate(deleteAllTranferHistoryValidation),
    deleteAllTransferHistories
  );

router.get("/all", protect, auth("Super-admin"), getAllTransferHistories);

router.get(
  "/transfersstat",
  protect,
  auth("Super-admin", "Admin", "Client"),
  transferStat
);

router
  .route("/:id")
  .get(protect, auth("Client", "Super-admin"), getTransferHistory)
  .delete(protect, auth("Super-admin"), deleteTransferHistory);

// Export router
export default router;
