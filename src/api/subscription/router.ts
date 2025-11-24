import { Router } from "express";
import { verifyReceipt, revenueCatWebhook } from "./controller";
import protect from "../../utils/protect";

const router = Router();

// Legacy receipt verification (can be removed after migration)
router.post("/verify", protect, verifyReceipt);

// RevenueCat webhook (no authentication needed, uses webhook secret for verification)
router.post("/webhook", revenueCatWebhook);

export default router;
