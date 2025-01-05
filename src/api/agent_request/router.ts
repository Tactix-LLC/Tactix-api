import { Router } from "express";
const router: Router = Router();

import {
  createAgentRequest,
  getAllAgentRequest,
  getAgentRequest,
  updateAgentRequestStatus,
  deleteAgentRequest,
  deleteAllRequests,
  cancelRequest,
  getClientRequest,
  getByStatus,
  agentRequestStat,
  updateAllAgentRequests,
  getAgentsWithOutAgentCode,
  totalNumberOfAgents,
  updateCreditAgents,
} from "./controller";

import {
  createAgentRequestValidation,
  deleteAllRequestsValidator,
  updateAgentRequestStatusValidation,
  updateAgentsCreditValidation,
} from "./validation";

import protect from "../../utils/protect";
import auth from "../../utils/auth";
import validator from "../../utils/validator";

router
  .route("/")
  .post(
    protect,
    auth("Client"),
    validator(createAgentRequestValidation),
    createAgentRequest
  )
  .get(protect, auth("Super-admin", "Admin"), getAllAgentRequest)
  .delete(
    protect,
    auth("Super-admin", "Admin"),
    validator(deleteAllRequestsValidator),
    deleteAllRequests
  );

router.delete("/cancelrequest", protect, auth("Client"), cancelRequest);

router.get("/getclientrequest", protect, auth("Client"), getClientRequest);

router.get("/status", protect, auth("Super-admin", "Admin"), getByStatus);

router.get("/stat", protect, auth("Super-admin", "Admin"), agentRequestStat);

router.get(
  "/latest",
  protect,
  auth("Super-admin", "Admin"),
  getAgentsWithOutAgentCode
);

router.get(
  "/total",
  protect,
  auth("Super-admin", "Admin"),
  totalNumberOfAgents
);

router.patch("/all", protect, auth("Super-admin"), updateAllAgentRequests);

router.patch(
  "/credit",
  protect,
  auth("Super-admin"),
  validator(updateAgentsCreditValidation),
  updateCreditAgents
);

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getAgentRequest)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updateAgentRequestStatusValidation),
    updateAgentRequestStatus
  )
  .delete(protect, auth("Super-admin"), deleteAgentRequest);

export default router;
