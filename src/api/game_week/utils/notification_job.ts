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
   * Sends notification 2 hours before transfer deadline
   */
  static async scheduleTransferDeadlineReminder(gameWeek: IGameWeekDoc): Promise<void> {
    try {
      // Calculate notification time (2 hours before transfer deadline)
      const notificationTime = TimezoneUtil.calculateAutoJoinTime(gameWeek.transfer_deadline, 2);

      // Don't schedule if notification time has already passed
      if (notificationTime <= new Date()) {
        console.log(`⏰ Transfer deadline reminder time has passed for game week: ${gameWeek.game_week}`);
        return;
      }

      // Cancel existing job if any
      this.cancelNotificationJob(gameWeek._id.toString());

      // Schedule new job
      const job = schedule.scheduleJob(notificationTime, async () => {
        console.log(`🔔 Sending transfer deadline reminder for game week: ${gameWeek.game_week}`);
        await this.sendTransferDeadlineReminder(gameWeek._id.toString());
      });

      if (job) {
        this.jobs.set(gameWeek._id.toString(), job);
        console.log(`✅ Transfer deadline reminder scheduled for game week: ${gameWeek.game_week} at ${notificationTime.toISOString()}`);
      } else {
        console.error(`❌ Failed to schedule transfer deadline reminder for game week: ${gameWeek.game_week}`);
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

      // Get all clients with FCM tokens
      const clients = await Client.getAllClients({});
      const clientsWithTokens = clients.filter(client => client.fcm_token && client.fcm_token.trim() !== '');
      
      if (clientsWithTokens.length === 0) {
        console.log(`📱 No clients with FCM tokens found for game week: ${gameWeek.game_week}`);
        return;
      }

      // Prepare notification content
      const title = "⏰ Transfer Deadline Reminder";
      const body = `Transfer deadline for Game Week ${gameWeek.game_week} is in 2 hours! Make your transfers now to secure your team.`;
      const data = {
        type: 'transfer_deadline_reminder',
        game_week_id: gameWeekId,
        game_week: gameWeek.game_week || '',
        transfer_deadline: gameWeek.transfer_deadline.toISOString(),
      };

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
  static getScheduledNotificationJobs(): Array<{ gameWeekId: string; nextInvocation: string | null }> {
    const scheduledJobs: Array<{ gameWeekId: string; nextInvocation: string | null }> = [];
    
    this.jobs.forEach((job, gameWeekId) => {
      scheduledJobs.push({
        gameWeekId,
        nextInvocation: job.nextInvocation() ? job.nextInvocation()!.toISOString() : null,
      });
    });

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
  }> {
    return Array.from(this.completedJobs.values());
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
    console.log(`🔄 Rescheduling all notification jobs...`);
    
    // Clear old completed jobs first
    this.clearOldCompletedJobs();
    
    // Cancel all existing jobs
    this.cancelAllNotificationJobs();

    // Get all active game weeks
    const gameWeeks = await GameWeek.getAllGameWeeks({});
    
    // Schedule jobs for each game week
    for (const gameWeek of gameWeeks) {
      await this.scheduleTransferDeadlineReminder(gameWeek);
    }

    console.log(`✅ Rescheduled notification jobs for ${gameWeeks.length} game weeks`);
  }

  /**
   * Send test notification to all users
   */
  static async sendTestNotification(): Promise<{ successCount: number; failureCount: number; totalUsers: number }> {
    try {
      console.log('🧪 Sending test notification to all users...');

      // Get all clients with FCM tokens
      const clients = await Client.getAllClients({});
      const clientsWithTokens = clients.filter(client => client.fcm_token && client.fcm_token.trim() !== '');
      
      if (clientsWithTokens.length === 0) {
        console.log('📱 No clients with FCM tokens found');
        return { successCount: 0, failureCount: 0, totalUsers: 0 };
      }

      // Prepare test notification
      const title = "🧪 Test Notification";
      const body = "This is a test notification from Tactix Fantasy Football. Your notifications are working correctly!";
      const data = {
        type: 'test_notification',
        timestamp: new Date().toISOString(),
      };

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
