import express, { Router } from "express";
const router: Router = express.Router();

import {
  getAllPurchases,
  getPurchasesClient,
  getPurchase,
  deleteAllPurchases,
  deletePurchase,
  deletePurchasesClient,
} from "./controller";

import { deleteAllPurchasesValidation } from "./validation";
import validator from "../../utils/validator";

import protect from "../../utils/protect";
import auth from "../../utils/auth";

router
  .route("/")
  .get(protect, auth("Super-admin", "Admin"), getAllPurchases)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllPurchasesValidation),
    deleteAllPurchases
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getPurchase)
  .delete(protect, auth("Super-admin"), deletePurchase);

router
  .route("/client/:client_id")
  .get(protect, auth("Super-admin", "Admin", "Client"), getPurchasesClient)
  .delete(protect, auth("Super-admin"), deletePurchasesClient);

export default router;
