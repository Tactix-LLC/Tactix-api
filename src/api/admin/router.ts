import { Router } from "express";

const router = Router();

import {
  createAdminFirstAccount,
  adminLogin,
  getAdmin,
  updateDefaultPassword,
  createAdmin,
  updateAdminProfile,
  updateEmailOrPhoneNumber,
  updateAdminRole,
  updateAdminPassword,
  resetAdminPassword,
  updateAdminAccountStatus,
  deleteAdmin,
  deleteAllAdmins,
  getAllAdmins,
} from "./controller";

import {
  getAllSubscriptions,
  getUserSubscription,
  getSubscriptionAnalytics,
  expireSubscription,
  syncSubscriptionFromRevenueCat
} from "./subscription_controller";

import {
  createFirstAdminValidation,
  adminLoginValidation,
  updateDefaultPasswordValidation,
  createAdminValidation,
  updateEmailOrPhoneNumberValidation,
  updateAdminRoleValidation,
  updateAdminPasswordValidation,
  resetAdminPasswordValidation,
  updateAdminAccountStatusValidation,
  deleteAllAdminsValidation,
} from "./validation";

import validator from "../../utils/validator";

import protect from "../../utils/protect";
import bypass from "../../utils/bypass";
import auth from "../../utils/auth";

router.post("/login", validator(adminLoginValidation), adminLogin);
router.patch(
  "/defaultpassword",
  bypass,
  validator(updateDefaultPasswordValidation),
  updateDefaultPassword
);

router
  .route("/firstaccount")
  .post(validator(createFirstAdminValidation), createAdminFirstAccount);

router.patch(
  "/profile",
  protect,
  auth("Super-admin", "Admin", "Call-center"),
  updateAdminProfile
);

router.patch(
  "/emailorphonenumber",
  protect,
  auth("Super-admin", "Admin", "Call-center"),
  validator(updateEmailOrPhoneNumberValidation),
  updateEmailOrPhoneNumber
);

router.patch(
  "/password",
  protect,
  auth("Super-admin", "Admin", "Call-center"),
  validator(updateAdminPasswordValidation),
  updateAdminPassword
);

router.patch(
  "/resetpassword",
  protect,
  auth("Super-admin"),
  validator(resetAdminPasswordValidation),
  resetAdminPassword
);

router.patch(
  "/role",
  protect,
  auth("Super-admin"),
  validator(updateAdminRoleValidation),
  updateAdminRole
);

router.patch(
  "/accountstatus",
  protect,
  auth("Super-admin"),
  validator(updateAdminAccountStatusValidation),
  updateAdminAccountStatus
);

// Subscription routes
router.get(
  "/subscriptions",
  protect,
  auth("Super-admin", "Admin"),
  getAllSubscriptions
);

router.get(
  "/subscriptions/analytics",
  protect,
  auth("Super-admin", "Admin"),
  getSubscriptionAnalytics
);

router.get(
  "/subscriptions/:userId",
  protect,
  auth("Super-admin", "Admin"),
  getUserSubscription
);

router.patch(
  "/subscriptions/:userId/expire",
  protect,
  auth("Super-admin", "Admin"),
  expireSubscription
);

router.post(
  "/subscriptions/:userId/sync",
  protect,
  auth("Super-admin", "Admin"),
  syncSubscriptionFromRevenueCat
);

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createAdminValidation),
    createAdmin
  )
  .get(protect, auth("Super-admin"), getAllAdmins)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllAdminsValidation),
    deleteAllAdmins
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin", "Call-center"), getAdmin)
  .delete(protect, auth("Super-admin"), deleteAdmin);

export default router;
