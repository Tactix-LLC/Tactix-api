import Router from "express";
const router = Router();
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";
import {
  validateCreateAPI,
  validateDeleteAll,
  validatePollResponse,
  validateUpdateAPI,
  validateUpdateStatus,
} from "./validation";
import {
  createPoll,
  createPollResponse,
  deleteAllPolls,
  deleteByid,
  getAll,
  getAllPollResponses,
  getById,
  getResponseByUserId,
  getUserPolls,
  updatePollInfo,
  updatePollStatus,
} from "./controller";

// Mount routes with their respective controller methods
router
  .route("/")
  .post(protect, auth("Super-admin"), validator(validateCreateAPI), createPoll)
  .get(protect, auth("Super-admin", "Admin", "Client"), getAll)
  .delete(
    protect,
    auth("Super-admin"),
    validator(validateDeleteAll),
    deleteAllPolls
  );

router.patch(
  "/status/:pollId",
  protect,
  auth("Super-admin"),
  validator(validateUpdateStatus),
  updatePollStatus
);

router
  .route("/pollresponse")
  .patch(
    protect,
    auth("Super-admin", "Admin", "Client"),
    validator(validatePollResponse),
    createPollResponse
  )
  .get(protect, auth("Super-admin", "Admin"), getAllPollResponses);

router.get(
  "/pollresponse/:userId/:pollId",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getResponseByUserId
);

router.get(
  "/userpolls/:userId",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getUserPolls
);

router
  .route("/:pollId")
  .get(protect, auth("Super-admin", "Admin", "Client"), getById)
  .patch(
    protect,
    auth("Super-admin"),
    validator(validateUpdateAPI),
    updatePollInfo
  )
  .delete(protect, auth("Super-admin"), deleteByid);

// Export router
export default router;
