import schedule from 'node-schedule';
import GameWeek from '../dal';
import Client from '../../client/dal';
import IGameWeekDoc from '../dto';
import TimezoneUtil from '../../../utils/timezone';
import FirebaseService from '../../../utils/firebase';

/**
 * Notification job manager for game week notifications
 * Handles transfer deadline reminders and other game week notifications
 */
export class NotificationJobManager {
  private static jobs: Map<string, schedule.Job> = new Map();
  private static completedJobs: Map<string, { 
    gameWeekId: string; 
    executedAt: Date; 
    results: { successCount: number; failureCount: number; totalUsers: number };
    gameWeek: string;
  }> = new Map();

  /**
   * Schedule transfer deadline reminder notification
   * Sends notification 2 hours before transfer deadline (or custom hours for testing)
   */
  static async scheduleTransferDeadlineReminder(gameWeek: IGameWeekDoc, hoursBefore: number = 2): Promise<void> {
    try {
      // Skip if game week is already done
      if (gameWeek.is_done) {
        console.log(`⏭️ Skipping notification scheduling for game week ${gameWeek.game_week} - already marked as done`);
        return;
      }

      // Calculate notification time (hoursBefore hours before transfer deadline)
      // For testing: use minutes if hoursBefore < 1 (e.g., 0.05 = 3 minutes)
      let notificationTime: Date;
      if (hoursBefore < 1) {
        // Use minutes for testing (hoursBefore * 60 = minutes)
        const minutesBefore = hoursBefore * 60;
        notificationTime = new Date(gameWeek.transfer_deadline.getTime() - (minutesBefore * 60 * 1000));
      } else {
        notificationTime = TimezoneUtil.calculateAutoJoinTime(gameWeek.transfer_deadline, hoursBefore);
      }

      // Don't schedule if notification time has already passed
      if (notificationTime <= new Date()) {
        console.log(`⏰ Transfer deadline reminder time has passed for game week: ${gameWeek.game_week} (deadline: ${gameWeek.transfer_deadline.toISOString()}, notification time: ${notificationTime.toISOString()})`);
        return;
      }

      // Cancel existing job if any
      this.cancelNotificationJob(gameWeek._id.toString());

      // Schedule new job
      const job = schedule.scheduleJob(notificationTime, async () => {
        try {
          console.log(`🔔 Executing scheduled transfer deadline reminder for game week: ${gameWeek.game_week}`);
          await this.sendTransferDeadlineReminder(gameWeek._id.toString());
        } catch (error) {
          console.error(`❌ Error in scheduled notification job for game week ${gameWeek.game_week}:`, error);
        }
      });

      if (job) {
        this.jobs.set(gameWeek._id.toString(), job);
        const now = new Date();
        const timeUntilNotification = Math.round((notificationTime.getTime() - now.getTime()) / 1000 / 60); // minutes
        console.log(`✅ Transfer deadline reminder scheduled for game week: ${gameWeek.game_week}`);
        console.log(`   📅 Notification time: ${notificationTime.toISOString()}`);
        console.log(`   ⏳ Time until notification: ${timeUntilNotification} minutes (${(timeUntilNotification / 60).toFixed(1)} hours)`);
        console.log(`   🎯 Transfer deadline: ${gameWeek.transfer_deadline.toISOString()}`);
      } else {
        console.error(`❌ Failed to schedule transfer deadline reminder for game week: ${gameWeek.game_week} - schedule.scheduleJob returned null`);
      }
    } catch (error) {
      console.error(`❌ Error scheduling transfer deadline reminder for game week ${gameWeek.game_week}:`, error);
    }
  }

  /**
   * Send transfer deadline reminder notification
   */
  private static async sendTransferDeadlineReminder(gameWeekId: string): Promise<void> {
    try {
      const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
      if (!gameWeek) {
        console.error(`❌ Game week not found: ${gameWeekId}`);
        return;
      }

      // Get current environment from config
      const currentEnvironment = process.env.NODE_ENV || "production";
      
      // Get all clients with FCM tokens, filtered by current environment
      // Use getAllClientsWithoutPagination to ensure we get all clients (same as auto-join job)
      const clients = await Client.getAllClientsWithoutPagination();
      console.log(`🔍 Checking ${clients.length} clients for FCM tokens in ${currentEnvironment} environment`);
      
      const clientsWithTokens = clients.filter(client => {
        const hasToken = client.fcm_token && client.fcm_token.trim() !== '';
        // Users without environment field default to production only
        const matchesEnvironment = (!client.environment && currentEnvironment === "production") || client.environment === currentEnvironment;
        
        if (hasToken) {
          console.log(`  👤 User ${client._id} (${client.first_name} ${client.last_name}): hasToken=${hasToken}, env="${client.environment || 'none'}", matches=${matchesEnvironment}`);
        }
        
        return hasToken && matchesEnvironment;
      });
      
      if (clientsWithTokens.length === 0) {
        // Debug: check why no users were found
        const clientsWithTokensButWrongEnv = clients.filter(client => {
          const hasToken = client.fcm_token && client.fcm_token.trim() !== '';
          return hasToken;
        });
        console.log(`📱 No clients with FCM tokens found for game week: ${gameWeek.game_week} in environment: ${currentEnvironment}`);
        console.log(`   Total clients: ${clients.length}`);
        console.log(`   Clients with FCM tokens (any env): ${clientsWithTokensButWrongEnv.length}`);
        if (clientsWithTokensButWrongEnv.length > 0) {
          clientsWithTokensButWrongEnv.forEach(client => {
            console.log(`     - ${client.first_name} ${client.last_name} (${client.email}): env="${client.environment || 'none'}"`);
          });
        }
        return;
      }

      // Prepare notification content with environment prefix for non-production
      const envPrefix = currentEnvironment !== "production" ? `[${currentEnvironment.toUpperCase()}] ` : "";
      const title = `${envPrefix}⏰ Transfer Deadline Reminder`;
      const body = `Transfer deadline for Game Week ${gameWeek.game_week} is in 2 hours! Make your transfers now to secure your team.`;
      const data = {
        type: 'transfer_deadline_reminder',
        game_week_id: gameWeekId,
        game_week: gameWeek.game_week || '',
        transfer_deadline: gameWeek.transfer_deadline.toISOString(),
        environment: currentEnvironment,
      };
      
      console.log(`🔔 Sending notifications to ${clientsWithTokens.length} clients in ${currentEnvironment} environment`);

      // Extract FCM tokens
      const fcmTokens = clientsWithTokens.map(client => client.fcm_token!).filter(token => token);

      // Send notifications in batches (Firebase has a limit of 500 tokens per request)
      const batchSize = 500;
      let totalSuccess = 0;
      let totalFailure = 0;

      for (let i = 0; i < fcmTokens.length; i += batchSize) {
        const batch = fcmTokens.slice(i, i + batchSize);
        
        const result = await FirebaseService.sendNotificationToMultipleDevices(
          batch,
          title,
          body,
          data
        );

        totalSuccess += result.successCount;
        totalFailure += result.failureCount;

        console.log(`📱 Batch ${Math.floor(i / batchSize) + 1}: ${result.successCount} successful, ${result.failureCount} failed`);
      }

      // Store completion record
      this.completedJobs.set(gameWeekId, {
        gameWeekId,
        executedAt: new Date(),
        results: {
          successCount: totalSuccess,
          failureCount: totalFailure,
          totalUsers: clientsWithTokens.length,
        },
        gameWeek: gameWeek.game_week || 'Unknown',
      });

      console.log(`✅ Transfer deadline reminder completed for game week ${gameWeek.game_week}: ${totalSuccess} successful, ${totalFailure} failed out of ${clientsWithTokens.length} users`);

      // Cancel the job after execution
      this.cancelNotificationJob(gameWeekId);

    } catch (error) {
      console.error(`❌ Error sending transfer deadline reminder for game week ${gameWeekId}:`, error);
    }
  }

  /**
   * Cancel notification job for a game week
   */
  static cancelNotificationJob(gameWeekId: string): void {
    const job = this.jobs.get(gameWeekId);
    if (job) {
      job.cancel();
      this.jobs.delete(gameWeekId);
      console.log(`🗑️ Cancelled notification job for game week: ${gameWeekId}`);
    }
  }

  /**
   * Cancel all notification jobs
   */
  static cancelAllNotificationJobs(): void {
    this.jobs.forEach((job, gameWeekId) => {
      job.cancel();
      console.log(`🗑️ Cancelled notification job for game week: ${gameWeekId}`);
    });
    this.jobs.clear();
    console.log('🗑️ All notification jobs cancelled');
  }

  /**
   * Get all scheduled notification jobs
   */
  static async getScheduledNotificationJobs(): Promise<Array<{ 
    gameWeekId: string; 
    gameWeek: string;
    nextInvocation: string | null;
    timeUntilNotification: number | null; // minutes
    transferDeadline: string | null;
    status: 'scheduled' | 'pending';
    successCount: number | null;
    failureCount: number | null;
    totalUsers: number | null;
  }>> {
    const scheduledJobs: Array<{ 
      gameWeekId: string; 
      gameWeek: string;
      nextInvocation: string | null;
      timeUntilNotification: number | null;
      transferDeadline: string | null;
      status: 'scheduled' | 'pending';
      successCount: number | null;
      failureCount: number | null;
      totalUsers: number | null;
    }> = [];
    
    for (const [gameWeekId, job] of this.jobs.entries()) {
      try {
        const nextInvocation = job.nextInvocation();
        const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
        
        let timeUntilNotification: number | null = null;
        if (nextInvocation) {
          timeUntilNotification = Math.round((nextInvocation.getTime() - Date.now()) / 1000 / 60);
        }
        
        // Check if there's a completed job for this game week
        const completedJob = this.completedJobs.get(gameWeekId);
        
        scheduledJobs.push({
          gameWeekId,
          gameWeek: gameWeek?.game_week || 'Unknown',
          nextInvocation: nextInvocation ? nextInvocation.toISOString() : null,
          timeUntilNotification,
          transferDeadline: gameWeek?.transfer_deadline ? gameWeek.transfer_deadline.toISOString() : null,
          status: completedJob ? 'pending' : 'scheduled', // pending if executed but still in scheduled list
          successCount: completedJob?.results.successCount ?? null,
          failureCount: completedJob?.results.failureCount ?? null,
          totalUsers: completedJob?.results.totalUsers ?? null,
        });
      } catch (error) {
        console.error(`❌ Error getting scheduled job info for ${gameWeekId}:`, error);
        scheduledJobs.push({
          gameWeekId,
          gameWeek: 'Unknown',
          nextInvocation: null,
          timeUntilNotification: null,
          transferDeadline: null,
          status: 'scheduled',
          successCount: null,
          failureCount: null,
          totalUsers: null,
        });
      }
    }

    return scheduledJobs;
  }

  /**
   * Get completed notification jobs
   */
  static getCompletedNotificationJobs(): Array<{ 
    gameWeekId: string; 
    executedAt: Date; 
    results: { successCount: number; failureCount: number; totalUsers: number };
    gameWeek: string;
    status: 'completed';
    nextInvocation: null;
    timeUntilNotification: null;
    transferDeadline: string | null;
    successCount: number;
    failureCount: number;
    totalUsers: number;
  }> {
    return Array.from(this.completedJobs.values()).map(job => ({
      ...job,
      status: 'completed' as const,
      nextInvocation: null,
      timeUntilNotification: null,
      transferDeadline: null, // Will be populated in controller if needed
      successCount: job.results.successCount,
      failureCount: job.results.failureCount,
      totalUsers: job.results.totalUsers,
    }));
  }

  /**
   * Get all notifications (scheduled + completed) with unified format
   */
  static async getAllNotifications(): Promise<Array<{
    gameWeekId: string;
    gameWeek: string;
    status: 'scheduled' | 'pending' | 'completed';
    nextInvocation: string | null;
    executedAt: Date | null;
    timeUntilNotification: number | null; // minutes
    transferDeadline: string | null;
    successCount: number | null;
    failureCount: number | null;
    totalUsers: number | null;
  }>> {
    const scheduled = await this.getScheduledNotificationJobs();
    const completed = this.getCompletedNotificationJobs();

    // Get transfer deadlines for completed jobs
    const completedWithDeadlines = await Promise.all(
      completed.map(async (job) => {
        try {
          const gameWeek = await GameWeek.getGameWeekById(job.gameWeekId);
          return {
            ...job,
            transferDeadline: gameWeek?.transfer_deadline ? gameWeek.transfer_deadline.toISOString() : null,
          };
        } catch (error) {
          return {
            ...job,
            transferDeadline: null,
          };
        }
      })
    );

    // Combine scheduled and completed, mark completed ones that are still in scheduled list as 'pending'
    const scheduledMap = new Map(scheduled.map(s => [s.gameWeekId, s]));
    const completedMap = new Map(completedWithDeadlines.map(c => [c.gameWeekId, c]));

    const allNotifications: Array<{
      gameWeekId: string;
      gameWeek: string;
      status: 'scheduled' | 'pending' | 'completed';
      nextInvocation: string | null;
      executedAt: Date | null;
      timeUntilNotification: number | null;
      transferDeadline: string | null;
      successCount: number | null;
      failureCount: number | null;
      totalUsers: number | null;
    }> = [];

    // Add all scheduled (that aren't completed)
    scheduled.forEach(scheduledJob => {
      if (!completedMap.has(scheduledJob.gameWeekId)) {
        allNotifications.push({
          gameWeekId: scheduledJob.gameWeekId,
          gameWeek: scheduledJob.gameWeek,
          status: 'scheduled',
          nextInvocation: scheduledJob.nextInvocation,
          executedAt: null,
          timeUntilNotification: scheduledJob.timeUntilNotification,
          transferDeadline: scheduledJob.transferDeadline,
          successCount: null,
          failureCount: null,
          totalUsers: null,
        });
      }
    });

    // Add all completed
    completedWithDeadlines.forEach(completedJob => {
      allNotifications.push({
        gameWeekId: completedJob.gameWeekId,
        gameWeek: completedJob.gameWeek,
        status: completedJob.executedAt && scheduledMap.has(completedJob.gameWeekId) ? 'pending' : 'completed',
        nextInvocation: null,
        executedAt: completedJob.executedAt ? (completedJob.executedAt instanceof Date ? completedJob.executedAt : new Date(completedJob.executedAt)) : null,
        timeUntilNotification: null,
        transferDeadline: completedJob.transferDeadline,
        successCount: completedJob.successCount,
        failureCount: completedJob.failureCount,
        totalUsers: completedJob.totalUsers,
      });
    });

    // Sort by status (scheduled first, then pending, then completed), then by time
    allNotifications.sort((a, b) => {
      const statusOrder = { scheduled: 0, pending: 1, completed: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // For scheduled/pending, sort by nextInvocation (earliest first)
      if (a.status === 'scheduled' || a.status === 'pending') {
        const timeA = a.nextInvocation ? new Date(a.nextInvocation).getTime() : 0;
        const timeB = b.nextInvocation ? new Date(b.nextInvocation).getTime() : 0;
        return timeB - timeA; // Descending (latest first)
      }
      
      // For completed, sort by executedAt (most recent first)
      if (a.executedAt && b.executedAt) {
        return b.executedAt.getTime() - a.executedAt.getTime();
      }
      return 0;
    });

    return allNotifications;
  }

  /**
   * Clear old completed jobs (older than 7 days)
   */
  static clearOldCompletedJobs(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let clearedCount = 0;
    this.completedJobs.forEach((job, gameWeekId) => {
      if (job.executedAt < sevenDaysAgo) {
        this.completedJobs.delete(gameWeekId);
        clearedCount++;
      }
    });

    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} old completed notification jobs`);
    }
  }

  /**
   * Reschedule all notification jobs (useful when settings change)
   */
  static async rescheduleAllNotificationJobs(): Promise<void> {
    const currentEnvironment = process.env.NODE_ENV || "production";
    console.log(`🔄 Rescheduling all notification jobs in ${currentEnvironment} environment...`);
    
    // Clear old completed jobs first
    this.clearOldCompletedJobs();
    
    // Cancel all existing jobs
    this.cancelAllNotificationJobs();

    try {
      // Get all game weeks (we'll filter them ourselves)
      const allGameWeeks = await GameWeek.getAllGameWeeks({});
      
      // Filter to only active (not done) game weeks
      const activeGameWeeks = allGameWeeks.filter(gw => !gw.is_done);
      
      console.log(`📊 Found ${allGameWeeks.length} total game weeks, ${activeGameWeeks.length} active (not done)`);
      
      let scheduledCount = 0;
      let skippedCount = 0;
      
      // Schedule jobs for each active game week
      for (const gameWeek of activeGameWeeks) {
        try {
          // Calculate notification time to check if it's valid (using default 2 hours)
          const notificationTime = TimezoneUtil.calculateAutoJoinTime(gameWeek.transfer_deadline, 2);
          
          if (notificationTime <= new Date()) {
            console.log(`⏭️ Skipping game week ${gameWeek.game_week} - notification time already passed (${notificationTime.toISOString()})`);
            skippedCount++;
            continue;
          }
          
          await this.scheduleTransferDeadlineReminder(gameWeek, 2); // Use default 2 hours
          scheduledCount++;
        } catch (error) {
          console.error(`❌ Error scheduling notification for game week ${gameWeek.game_week}:`, error);
        }
      }

      console.log(`✅ Rescheduled notification jobs: ${scheduledCount} scheduled, ${skippedCount} skipped out of ${activeGameWeeks.length} active game weeks`);
    } catch (error) {
      console.error(`❌ Error in rescheduleAllNotificationJobs:`, error);
      throw error;
    }
  }

  /**
   * Send test notification to all users
   */
  static async sendTestNotification(): Promise<{ successCount: number; failureCount: number; totalUsers: number }> {
    try {
      // Get current environment from config
      const currentEnvironment = process.env.NODE_ENV || "production";
      console.log(`🧪 Sending test notification to all users in ${currentEnvironment} environment...`);

      // Get all clients with FCM tokens, filtered by current environment
      // Use getAllClientsWithoutPagination to ensure we get all clients
      const clients = await Client.getAllClientsWithoutPagination();
      const clientsWithTokens = clients.filter(client => {
        const hasToken = client.fcm_token && client.fcm_token.trim() !== '';
        // Users without environment field default to production only
        const matchesEnvironment = (!client.environment && currentEnvironment === "production") || client.environment === currentEnvironment;
        return hasToken && matchesEnvironment;
      });
      
      if (clientsWithTokens.length === 0) {
        console.log(`📱 No clients with FCM tokens found in ${currentEnvironment} environment`);
        return { successCount: 0, failureCount: 0, totalUsers: 0 };
      }

      // Prepare test notification with environment prefix for non-production
      const envPrefix = currentEnvironment !== "production" ? `[${currentEnvironment.toUpperCase()}] ` : "";
      const title = `${envPrefix}🧪 Test Notification`;
      const body = "This is a test notification from Tactix Fantasy Football. Your notifications are working correctly!";
      const data = {
        type: 'test_notification',
        timestamp: new Date().toISOString(),
        environment: currentEnvironment,
      };
      
      console.log(`📱 Sending test notification to ${clientsWithTokens.length} clients in ${currentEnvironment} environment`);

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
          data
        );

        totalSuccess += result.successCount;
        totalFailure += result.failureCount;

        console.log(`📱 Test batch ${Math.floor(i / batchSize) + 1}: ${result.successCount} successful, ${result.failureCount} failed`);
      }

      console.log(`✅ Test notification completed: ${totalSuccess} successful, ${totalFailure} failed out of ${clientsWithTokens.length} users`);
      
      return {
        successCount: totalSuccess,
        failureCount: totalFailure,
        totalUsers: clientsWithTokens.length,
      };

    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return { successCount: 0, failureCount: 0, totalUsers: 0 };
    }
  }
}

export default NotificationJobManager;
