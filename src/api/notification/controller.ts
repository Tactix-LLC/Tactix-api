import { RequestHandler } from "express";
import NotificationJobManager from "../game_week/utils/notification_job";
import FirebaseService from "../../utils/firebase";
import Client from "../client/dal";
import ClientModel from "../client/model";
import AppError from "../../utils/app_error";

/**
 * Send test notification to all users
 */
export const sendTestNotification: RequestHandler = async (req, res, next) => {
  try {
    const result = await NotificationJobManager.sendTestNotification();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Test notification sent successfully",
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalUsers: result.totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get scheduled notification jobs
 */
export const getScheduledNotifications: RequestHandler = async (req, res, next) => {
  try {
    const scheduledJobs = NotificationJobManager.getScheduledNotificationJobs();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Scheduled notification jobs retrieved successfully",
      data: {
        scheduledJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get completed notification jobs
 */
export const getCompletedNotifications: RequestHandler = async (req, res, next) => {
  try {
    const completedJobs = NotificationJobManager.getCompletedNotificationJobs();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Completed notification jobs retrieved successfully",
      data: {
        completedJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule all notification jobs
 */
export const rescheduleAllNotifications: RequestHandler = async (req, res, next) => {
  try {
    await NotificationJobManager.rescheduleAllNotificationJobs();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "All notification jobs rescheduled successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's FCM token
 */
export const updateFCMToken: RequestHandler = async (req, res, next) => {
  try {
    const { fcm_token } = req.body;
    const clientId = (req as any).user?.id;

    if (!clientId) {
      return next(new AppError("User not authenticated", 401));
    }

    if (!fcm_token) {
      return next(new AppError("FCM token is required", 400));
    }

    // Validate FCM token
    const isValidToken = await FirebaseService.validateToken(fcm_token);
    if (!isValidToken) {
      return next(new AppError("Invalid FCM token", 400));
    }

    // Update client's FCM token
    await ClientModel.findByIdAndUpdate(clientId, { fcm_token }, { new: true });

    res.status(200).json({
      status: "SUCCESS",
      message: "FCM token updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send custom notification to all users
 */
export const sendCustomNotification: RequestHandler = async (req, res, next) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return next(new AppError("Title and body are required", 400));
    }

    // Get all clients with FCM tokens
    const allClients = await Client.getAllClients({});
    const clientsWithTokens = allClients.filter(client => client.fcm_token && client.fcm_token.trim() !== '');
    
    if (clientsWithTokens.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No users with FCM tokens found",
        data: {
          successCount: 0,
          failureCount: 0,
          totalUsers: 0,
        },
      });
    }

    // Extract FCM tokens
    const fcmTokens = clientsWithTokens.map(client => client.fcm_token!).filter(token => token);

    // Send notifications in batches
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize);
      
      const result = await FirebaseService.sendNotificationToMultipleDevices(
        batch,
        title,
        body,
        data || {}
      );

      totalSuccess += result.successCount;
      totalFailure += result.failureCount;
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Custom notification sent successfully",
      data: {
        successCount: totalSuccess,
        failureCount: totalFailure,
        totalUsers: clientsWithTokens.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification to specific users by IDs
 */
export const sendNotificationToUsers: RequestHandler = async (req, res, next) => {
  try {
    const { title, body, user_ids, data } = req.body;

    if (!title || !body || !user_ids || !Array.isArray(user_ids)) {
      return next(new AppError("Title, body, and user_ids array are required", 400));
    }

    // Get specific clients by IDs
    const clients = await Client.getAllClients({});
    const targetClients = clients.filter(client => 
      user_ids.includes(client._id.toString()) && 
      client.fcm_token && 
      client.fcm_token.trim() !== ''
    );
    
    if (targetClients.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No target users with FCM tokens found",
        data: {
          successCount: 0,
          failureCount: 0,
          totalUsers: 0,
        },
      });
    }

    // Extract FCM tokens
    const fcmTokens = targetClients.map(client => client.fcm_token!).filter(token => token);

    // Send notifications in batches
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize);
      
      const result = await FirebaseService.sendNotificationToMultipleDevices(
        batch,
        title,
        body,
        data || {}
      );

      totalSuccess += result.successCount;
      totalFailure += result.failureCount;
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Notification sent to selected users successfully",
      data: {
        successCount: totalSuccess,
        failureCount: totalFailure,
        totalUsers: targetClients.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification to topic (all users subscribed to a topic)
 */
export const sendNotificationToTopic: RequestHandler = async (req, res, next) => {
  try {
    const { title, body, topic, data } = req.body;

    if (!title || !body || !topic) {
      return next(new AppError("Title, body, and topic are required", 400));
    }

    const success = await FirebaseService.sendNotificationToTopic(
      topic,
      title,
      body,
      data || {}
    );

    res.status(200).json({
      status: "SUCCESS",
      message: `Notification sent to topic '${topic}' successfully`,
      data: {
        success,
        topic,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification templates
 */
export const getNotificationTemplates: RequestHandler = async (req, res, next) => {
  try {
    const templates = [
      {
        id: "game_week_reminder",
        name: "Game Week Reminder",
        title: "⏰ Game Week Starting Soon!",
        body: "Don't forget to make your transfers for Game Week {game_week}. Transfer deadline is approaching!",
        category: "game_week",
      },
      {
        id: "transfer_deadline",
        name: "Transfer Deadline Alert",
        title: "🚨 Transfer Deadline Approaching!",
        body: "Transfer deadline for Game Week {game_week} is in {hours} hours. Make your changes now!",
        category: "transfer",
      },
      {
        id: "maintenance",
        name: "Maintenance Notice",
        title: "🔧 Scheduled Maintenance",
        body: "We will be performing scheduled maintenance on {date} from {start_time} to {end_time}. The app may be temporarily unavailable.",
        category: "maintenance",
      },
      {
        id: "promotion",
        name: "Promotion/Offer",
        title: "🎉 Special Offer!",
        body: "Check out our latest promotion: {promotion_details}. Don't miss out on this amazing deal!",
        category: "promotion",
      },
      {
        id: "update",
        name: "App Update",
        title: "📱 App Update Available",
        body: "A new version of Tactix Fantasy Football is available. Update now to get the latest features and improvements!",
        category: "update",
      },
      {
        id: "custom",
        name: "Custom Message",
        title: "",
        body: "",
        category: "custom",
      },
    ];

    res.status(200).json({
      status: "SUCCESS",
      message: "Notification templates retrieved successfully",
      data: {
        templates,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats: RequestHandler = async (req, res, next) => {
  try {
    // Get total clients
    const allClients = await Client.getAllClients({});
    const totalClients = allClients.length;

    // Get clients with FCM tokens
    const clientsWithTokens = allClients.filter(client => client.fcm_token && client.fcm_token.trim() !== '');
    const clientsWithTokensCount = clientsWithTokens.length;

    // Get scheduled jobs
    const scheduledJobs = NotificationJobManager.getScheduledNotificationJobs();
    const completedJobs = NotificationJobManager.getCompletedNotificationJobs();

    res.status(200).json({
      status: "SUCCESS",
      message: "Notification statistics retrieved successfully",
      data: {
        totalClients,
        clientsWithTokens: clientsWithTokensCount,
        clientsWithoutTokens: totalClients - clientsWithTokensCount,
        scheduledJobs: scheduledJobs.length,
        completedJobs: completedJobs.length,
        lastCompletedJob: completedJobs.length > 0 ? completedJobs[completedJobs.length - 1] : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
