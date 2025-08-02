import express, { Router } from "express";
const router: Router = Router();

import {
  creditTopupValidation,
  withdrawalValidation,
  transferCreditValidation,
  transferCreditAdminValidation,
  stripeSessionValidation,
} from "./validation";

import {
  pay,
  verifyPayment,
  withdrawal,
  paymentErrorRedirection,
  paymentSuccessRedirection,
  transferCreditForAdmin,
  transferCredit,
  stripepayment,
} from "./controller";

import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";

router.post(
  "/pay",
  protect,
  auth("Client"),
  validator(creditTopupValidation),
  pay
);

router.get("/verify", verifyPayment);
router.post(
  "/withdrawal",
  protect,
  auth("Client"),
  validator(withdrawalValidation),
  withdrawal
);
router.post(
  "/transfer/admin",
  protect,
  auth("Super-admin"),
  validator(transferCreditAdminValidation),
  transferCreditForAdmin
);

router.post(
  "/transfer",
  protect,
  auth("Client"),
  validator(transferCreditValidation),
  transferCredit
);

router.post(
  "/stripepayment",
  protect,
  auth("Client"),
  validator(stripeSessionValidation),
  stripepayment
);

export default router;
