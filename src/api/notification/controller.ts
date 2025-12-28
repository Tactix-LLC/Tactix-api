import { RequestHandler } from "express";
import NotificationJobManager from "../game_week/utils/notification_job";
import FirebaseService from "../../utils/firebase";
import Client from "../client/dal";
import ClientModel from "../client/model";
import AppError from "../../utils/app_error";
import { body, validationResult } from "express-validator";

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
    const scheduledJobs = await NotificationJobManager.getScheduledNotificationJobs();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Scheduled notification jobs retrieved successfully",
      data: {
        scheduledJobs,
        count: scheduledJobs.length,
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
 * Get all notifications (scheduled + completed) with unified format
 */
export const getAllNotifications: RequestHandler = async (req, res, next) => {
  try {
    const allNotifications = await NotificationJobManager.getAllNotifications();
    
    // Serialize dates to ISO strings for JSON response
    const serializedNotifications = allNotifications.map(notification => ({
      ...notification,
      executedAt: notification.executedAt ? notification.executedAt.toISOString() : null,
    }));
    
    res.status(200).json({
      status: "SUCCESS",
      message: "All notifications retrieved successfully",
      data: {
        notifications: serializedNotifications,
        count: serializedNotifications.length,
        scheduled: serializedNotifications.filter(n => n.status === 'scheduled').length,
        pending: serializedNotifications.filter(n => n.status === 'pending').length,
        completed: serializedNotifications.filter(n => n.status === 'completed').length,
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

    // Get current environment from config
    const currentEnvironment = process.env.NODE_ENV || "production";

    // Update client's FCM token and environment
    await ClientModel.findByIdAndUpdate(
      clientId, 
      { 
        fcm_token,
        environment: currentEnvironment
      }, 
      { new: true }
    );

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

    // Get current environment from config
    const currentEnvironment = process.env.NODE_ENV || "production";
    
    // Get all clients with FCM tokens, filtered by current environment
    const allClients = await Client.getAllClients({});
    const clientsWithTokens = allClients.filter(client => {
      const hasToken = client.fcm_token && client.fcm_token.trim() !== '';
      // Users without environment field default to production only
      const matchesEnvironment = (!client.environment && currentEnvironment === "production") || client.environment === currentEnvironment;
      return hasToken && matchesEnvironment;
    });
    
    if (clientsWithTokens.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: `No users with FCM tokens found in ${currentEnvironment} environment`,
        data: {
          successCount: 0,
          failureCount: 0,
          totalUsers: 0,
        },
      });
    }
    
    // Add environment prefix to title for non-production
    const envPrefix = currentEnvironment !== "production" ? `[${currentEnvironment.toUpperCase()}] ` : "";
    const finalTitle = envPrefix + title;

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
        finalTitle,
        body,
        { ...(data || {}), environment: currentEnvironment }
      );

      totalSuccess += result.successCount;
      totalFailure += result.failureCount;
    }

    res.status(200).json({
      status: "SUCCESS",
      message: `Custom notification sent successfully to ${clientsWithTokens.length} users in ${currentEnvironment} environment`,
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

    // Get current environment from config
    const currentEnvironment = process.env.NODE_ENV || "production";
    
    // Normalize user_ids to strings for comparison (handle both string and ObjectId formats)
    const normalizedUserIds = user_ids.map(id => {
      // If it's already a string, use it; otherwise convert to string
      const idStr = typeof id === 'string' ? id : String(id);
      // Remove any MongoDB ObjectId wrapper if present
      return idStr.replace(/^ObjectId\(|\)$/g, '');
    });
    
    console.log(`📤 Sending notification to ${normalizedUserIds.length} user(s) in ${currentEnvironment} environment`);
    
    // Get specific clients by IDs (get all clients without pagination limit)
    const clients = await Client.getAllClients({ limit: 100000 });
    
    // Filter clients by the provided IDs
    const allSelectedClients = clients.filter(client => {
      const clientIdStr = String(client._id);
      return normalizedUserIds.includes(clientIdStr);
    });
    
    const targetClients = allSelectedClients.filter(client => {
      const hasToken = client.fcm_token && client.fcm_token.trim() !== '';
      // Users without environment field default to production only
      const matchesEnvironment = (!client.environment && currentEnvironment === "production") || client.environment === currentEnvironment;
      return hasToken && matchesEnvironment;
    });
    
    if (targetClients.length === 0) {
      // Check why no users were found (use already filtered allSelectedClients)
      const clientsWithoutTokens = allSelectedClients.filter(client => !client.fcm_token || client.fcm_token.trim() === '');
      const clientsWrongEnvironment = allSelectedClients.filter(client => {
        const hasToken = client.fcm_token && client.fcm_token.trim() !== '';
        if (!hasToken) return false;
        const matchesEnvironment = (!client.environment && currentEnvironment === "production") || client.environment === currentEnvironment;
        return !matchesEnvironment;
      });
      
      let message = `No target users with FCM tokens found in ${currentEnvironment} environment`;
      if (clientsWithoutTokens.length > 0 && clientsWrongEnvironment.length > 0) {
        message += `. ${clientsWithoutTokens.length} user(s) don't have FCM tokens, ${clientsWrongEnvironment.length} user(s) are in a different environment.`;
      } else if (clientsWithoutTokens.length > 0) {
        message += `. ${clientsWithoutTokens.length} selected user(s) don't have FCM tokens registered.`;
      } else if (clientsWrongEnvironment.length > 0) {
        message += `. ${clientsWrongEnvironment.length} selected user(s) are in a different environment.`;
      }
      
      return res.status(200).json({
        status: "SUCCESS",
        message,
        data: {
          successCount: 0,
          failureCount: 0,
          totalUsers: user_ids.length,
          eligibleUsers: 0,
        },
      });
    }

    // Extract FCM tokens
    const fcmTokens = targetClients.map(client => client.fcm_token!).filter(token => token);

    // Add environment prefix to title for non-production
    const envPrefix = currentEnvironment !== "production" ? `[${currentEnvironment.toUpperCase()}] ` : "";
    const finalTitle = envPrefix + title;

    // Send notifications in batches
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize);
      
      const result = await FirebaseService.sendNotificationToMultipleDevices(
        batch,
        finalTitle,
        body,
        { ...(data || {}), environment: currentEnvironment }
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

    // Get current environment from config
    const currentEnvironment = process.env.NODE_ENV || "production";
    
    // Add environment prefix to title for non-production
    const envPrefix = currentEnvironment !== "production" ? `[${currentEnvironment.toUpperCase()}] ` : "";
    const finalTitle = envPrefix + title;

    const success = await FirebaseService.sendNotificationToTopic(
      topic,
      finalTitle,
      body,
      { ...(data || {}), environment: currentEnvironment }
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
    const scheduledJobs = await NotificationJobManager.getScheduledNotificationJobs();
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

/**
 * Test endpoint: Schedule notification for a game week with custom time (for testing)
 */
export const testScheduleNotification: RequestHandler = async (req, res, next) => {
  try {
    const { minutes_before = 3, game_week_id } = req.body; // Default to 3 minutes for testing
    
    const GameWeek = (await import("../game_week/dal")).default;
    let gameWeek;
    
    // Get game week by ID if provided, otherwise try to get active, otherwise get first available
    if (game_week_id) {
      gameWeek = await GameWeek.getGameWeekById(game_week_id);
    } else {
      gameWeek = await GameWeek.getLiveGameWeek();
      if (!gameWeek) {
        // If no active game week, get the first available game week
        const allGameWeeks = await GameWeek.getAllGameWeeks({ limit: 1 });
        if (allGameWeeks.length > 0) {
          gameWeek = allGameWeeks[0];
        }
      }
    }
    
    if (!gameWeek) {
      return next(new AppError("No game week found. Please provide a game_week_id", 404));
    }

    // Update the game week's transfer deadline to be (minutes_before + 1) minutes from now
    // This ensures the notification time will be minutes_before minutes from now
    const newDeadline = new Date(Date.now() + ((minutes_before + 1) * 60 * 1000));
    
    // Update the deadline in the game week object (temporarily for scheduling)
    gameWeek.transfer_deadline = newDeadline;

    // Convert minutes to hours (for the function parameter)
    const hoursBefore = minutes_before / 60; // e.g., 3 minutes = 0.05 hours

    // Schedule with custom time
    await NotificationJobManager.scheduleTransferDeadlineReminder(gameWeek, hoursBefore);

    const notificationTime = new Date(gameWeek.transfer_deadline.getTime() - (minutes_before * 60 * 1000));
    const timeUntilNotification = Math.round((notificationTime.getTime() - Date.now()) / 1000 / 60);

    res.status(200).json({
      status: "SUCCESS",
      message: `Test notification scheduled for ${minutes_before} minutes from now`,
      data: {
        gameWeekId: gameWeek._id,
        gameWeek: gameWeek.game_week,
        notificationTime: notificationTime.toISOString(),
        transferDeadline: gameWeek.transfer_deadline.toISOString(),
        minutesBefore: minutes_before,
        timeUntilNotification: timeUntilNotification,
        currentTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || "Failed to schedule test notification", 500));
  }
};
