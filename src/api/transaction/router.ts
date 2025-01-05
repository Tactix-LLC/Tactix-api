import { Router } from "express";
import {
  createTransaction,
  getTranscations,
  getTranscation,
  deleteAllTransactions,
  deleteTransaction,
  getEveryTransactions,
  getClientTransactions,
} from "./controller";

import validate from "../../utils/validator";
import {
  createTransactionValidation,
  deleteAllGameValidation,
} from "./validation";

import protect from "../../utils/protect";
import auth from "../../utils/auth";

const router = Router();

router
  .route("/")
  .post(
    protect,
    auth("Client"),
    validate(createTransactionValidation),
    createTransaction
  )
  .get(protect, auth("Client"), getTranscations)
  .delete(
    protect,
    auth("Super-admin"),
    validate(deleteAllGameValidation),
    deleteAllTransactions
  );

router.get("/all", protect, auth("Super-admin"), getEveryTransactions);
router
  .route("/:id")
  .get(protect, auth("Client", "Super-admin"), getTranscation)
  .delete(protect, auth("Super-admin"), deleteTransaction);

router.get(
  "/clienttransactions/:clientId",
  protect,
  auth("Super-admin", "Admin"),
  getClientTransactions
);

// Export router
export default router;
