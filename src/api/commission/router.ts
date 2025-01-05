import Router from "express";
const router = Router();
import {
  deleteAllCommissions,
  deleteCommission,
  getAgentCommissions,
  getAllCommissions,
  getCommissionById,
} from "./controller";
import protect from "../../utils/protect";
import auth from "../../utils/auth";

// Mount routes with their controller methods
router
  .route("/all")
  .get(protect, auth("Super-admin", "Admin"), getAllCommissions)
  .delete(protect, auth("Super-admin"), deleteAllCommissions);

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getCommissionById)
  .delete(protect, auth("Super-admin"), deleteCommission);

router.get(
  "/agentcommissions/:agentId",
  protect,
  auth("Client", "Super-admin", "Admin"),
  getAgentCommissions
);

// Export router
export default router;
