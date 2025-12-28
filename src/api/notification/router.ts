import { Router } from "express";
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import {
  sendTestNotification,
  getScheduledNotifications,
  getCompletedNotifications,
  getAllNotifications,
  rescheduleAllNotifications,
  updateFCMToken,
  getNotificationStats,
  sendCustomNotification,
  sendNotificationToUsers,
  sendNotificationToTopic,
  getNotificationTemplates,
  testScheduleNotification,
} from "./controller";

const router = Router();

// Admin-only routes
router.get(
  "/test",
  protect,
  auth("Super-admin", "Admin"),
  sendTestNotification
);

router.get(
  "/scheduled",
  protect,
  auth("Super-admin", "Admin"),
  getScheduledNotifications
);

router.get(
  "/completed",
  protect,
  auth("Super-admin", "Admin"),
  getCompletedNotifications
);

router.get(
  "/all",
  protect,
  auth("Super-admin", "Admin"),
  getAllNotifications
);

router.post(
  "/reschedule",
  protect,
  auth("Super-admin", "Admin"),
  rescheduleAllNotifications
);

router.get(
  "/stats",
  protect,
  auth("Super-admin", "Admin"),
  getNotificationStats
);

router.get(
  "/templates",
  protect,
  auth("Super-admin", "Admin"),
  getNotificationTemplates
);

router.post(
  "/send/custom",
  protect,
  auth("Super-admin", "Admin"),
  sendCustomNotification
);

router.post(
  "/send/users",
  protect,
  auth("Super-admin", "Admin"),
  sendNotificationToUsers
);

router.post(
  "/send/topic",
  protect,
  auth("Super-admin", "Admin"),
  sendNotificationToTopic
);

router.post(
  "/test-schedule",
  protect,
  auth("Super-admin", "Admin"),
  testScheduleNotification
);

// Client routes
router.post(
  "/fcm-token",
  protect,
  auth("Client"),
  updateFCMToken
);

export default router;
