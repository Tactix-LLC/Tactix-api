import express from "express";
const router = express.Router();

import { sendOtp, verifyOtp } from "./otp/controller";
import {
  clientLogin,
  updateProfile,
  updatePin,
  forgotPin,
  verifyResetOtp,
  resetPin,
  getClient,
  getProfile,
  getClientByPhoneNumber,
  getAllClients,
  updateProfilePicture,
  updateAgentStatus,
  refundClient,
  changeClientStatus,
  checkAgentCode,
  getByAgentCode,
  deleteAllClients,
  deleteClient,
  countAllClients,
  updatePrizeBalance,
  clientsWithoutTeam,
  clientsJoiningGameweeks,
  agentsWorkRate,
  favoriteCoachStat,
  sendBulkSms,
  clientAgeGroup,
  agentsPhoneNumbersSMS,
  changeCommision,
  makeUsersAgent,
  getNonAgetUsers,
  updateGameweekPackage,
  buyPackageUsingCredit,
} from "./controller";

import { sendOtpValidation, verifyOtpValidation } from "./otp/validation";
import {
  loginValidation,
  updateProfileValidation,
  updatePinValidation,
  forgotPinValidation,
  verifyPinResetOtpValidation,
  resetPinValidation,
  updateProfilePictureValidation,
  updateAgentRequestStatusValidation,
  refundClientValidation,
  deleteAllClientsValidation,
  changeClientStatusValidation,
  updatePrizeValidation,
  sendBulkSmsValidation,
  changeClientCommisionValidation,
  refundPackageValidation,
  buyPackageUsingCreditValidation,
} from "./validation";
import validator from "../../utils/validator";

import protect from "../../utils/protect";
import auth from "../../utils/auth";

router.post("/sendotp", validator(sendOtpValidation), sendOtp);
router.post("/verifyotp", validator(verifyOtpValidation), verifyOtp);
router.post("/login", validator(loginValidation), clientLogin);

router.patch(
  "/profile",
  protect,
  auth("Client"),
  validator(updateProfileValidation),
  updateProfile
);

router.patch("/makeusersagent", protect, auth("Super-admin"), makeUsersAgent);
router.get("/nonagent", protect, auth("Super-admin"), getNonAgetUsers);

router.patch(
  "/pin",
  protect,
  auth("Client"),
  validator(updatePinValidation),
  updatePin
);

router.post("/forgot", validator(forgotPinValidation), forgotPin);
router.post(
  "/verifypinresetotp",
  validator(verifyPinResetOtpValidation),
  verifyResetOtp
);
router.post(
  "/sms",
  protect,
  auth("Super-admin"),
  validator(sendBulkSmsValidation),
  sendBulkSms
);

router.patch("/resetpin", validator(resetPinValidation), resetPin);

router.get(
  "/profile",
  protect,
  auth("Super-admin", "Admin", "Call-center", "Client"),
  getProfile
);

router.patch(
  "/profilepicture",
  protect,
  auth("Client"),
  validator(updateProfilePictureValidation),
  updateProfilePicture
);

router.get(
  "/referredbyagent",
  protect,
  auth("Super-admin", "Admin"),
  getByAgentCode
);

router.get(
  "/withoutteam",
  protect,
  auth("Super-admin", "Admin"),
  clientsWithoutTeam
);

router.get(
  "/joining",
  protect,
  auth("Super-admin", "Admin"),
  clientsJoiningGameweeks
);

router.get(
  "/agentsworkrate",
  protect,
  auth("Super-admin", "Admin"),
  agentsWorkRate
);

router.get(
  "/favoritecoach",
  protect,
  auth("Super-admin", "Admin"),
  favoriteCoachStat
);

router.get("/age", protect, auth("Super-admin", "Admin"), clientAgeGroup);

router.get(
  "/agentsphonenumbers",
  protect,
  auth("Super-admin", "Admin"),
  agentsPhoneNumbersSMS
);

router.patch(
  "/creditpackage",
  protect,
  auth("Client"),
  validator(buyPackageUsingCreditValidation),
  buyPackageUsingCredit
);

router
  .route("/")
  .get(protect, auth("Super-admin", "Admin", "Call-center"), getAllClients)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllClientsValidation),
    deleteAllClients
  );

router.get("/count", protect, auth("Super-admin", "Admin"), countAllClients);

router.patch(
  "/updateprize",
  protect,
  auth("Super-admin"),
  validator(updatePrizeValidation),
  updatePrizeBalance
);

router
  .route("/:id")
  .get(
    protect,
    auth("Super-admin", "Admin", "Call-center", "Client"),
    getClient
  )
  .delete(protect, auth("Super-admin"), deleteClient);

router.patch(
  "/:id/agentstatus",
  protect,
  auth("Super-admin"),
  validator(updateAgentRequestStatusValidation),
  updateAgentStatus
);
router.patch(
  "/:id/refund",
  protect,
  auth("Super-admin"),
  validator(refundClientValidation),
  refundClient
);
router.patch(
  "/:id/refundpackage",
  protect,
  auth("Super-admin"),
  validator(refundPackageValidation),
  updateGameweekPackage
);

router.get("/:agentcode/agent", checkAgentCode);
router.get(
  "/:phone_number/phonenumber",
  protect,
  auth("Super-admin", "Admin"),
  getClientByPhoneNumber
);
router.patch(
  "/:id/status",
  protect,
  auth("Super-admin", "Admin"),
  validator(changeClientStatusValidation),
  changeClientStatus
);

router.patch(
  "/:id/commision",
  protect,
  auth("Super-admin", "Admin"),
  validator(changeClientCommisionValidation),
  changeCommision
);

export default router;
