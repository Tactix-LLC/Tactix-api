import schedule from 'node-schedule';
import GameWeek from '../dal';
import GameWeekTeam from '../../game_week_team/dal';
import Team from '../../team/dal';
import Client from '../../client/dal';
import SystemSettings from '../../system_settings/model';
import AutoJoinLogDAL from '../../auto_join_log/dal';
import IGameWeekDoc from '../dto';
import TimezoneUtil from '../../../utils/timezone';

/**
 * Auto-join job system for game weeks
 * Automatically joins users to game weeks when deadline is reached
 */
export class AutoJoinJobManager {
  private static jobs: Map<string, schedule.Job> = new Map();
  private static completedJobs: Map<string, { 
    gameWeekId: string; 
    executedAt: Date; 
    results: { success: number; failed: number; errors: string[] };
    gameWeek: string;
  }> = new Map();

  /**
   * Schedule auto-join job for a game week
   */
  static async scheduleAutoJoinJob(gameWeek: IGameWeekDoc): Promise<void> {
    try {
      // Get system settings for auto-join configuration
      const settings = await SystemSettings.findOne().sort({ created_at: -1 });
      const autoJoinEnabled = settings?.auto_join?.enabled ?? true;
      const hoursBefore = settings?.auto_join?.hours_before_deadline ?? 0;

      if (!autoJoinEnabled) {
        console.log(`🚫 Auto-join disabled for game week: ${gameWeek.game_week}`);
        return;
      }

      // Calculate auto-join time using timezone utility
      const autoJoinTime = TimezoneUtil.calculateAutoJoinTime(gameWeek.transfer_deadline, hoursBefore);

      // Don't schedule if auto-join time has already passed
      if (autoJoinTime <= new Date()) {
        console.log(`⏰ Auto-join time has passed for game week: ${gameWeek.game_week}`);
        return;
      }

      // Cancel existing job if any
      this.cancelAutoJoinJob(gameWeek._id.toString());

      // Schedule new job
      const job = schedule.scheduleJob(autoJoinTime, async () => {
        console.log(`🚀 Starting auto-join for game week: ${gameWeek.game_week}`);
        await this.executeAutoJoin(gameWeek._id.toString());
      });

      if (job) {
        this.jobs.set(gameWeek._id.toString(), job);
        console.log(`✅ Auto-join scheduled for game week: ${gameWeek.game_week} at ${autoJoinTime.toISOString()}`);
      } else {
        console.error(`❌ Failed to schedule auto-join job for game week: ${gameWeek.game_week}`);
      }
    } catch (error) {
      console.error(`❌ Error scheduling auto-join job for game week ${gameWeek.game_week}:`, error);
    }
  }

  /**
   * Cancel auto-join job for a game week
   */
  static cancelAutoJoinJob(gameWeekId: string): void {
    const job = this.jobs.get(gameWeekId);
    if (job) {
      job.cancel();
      this.jobs.delete(gameWeekId);
      console.log(`🗑️ Cancelled auto-join job for game week: ${gameWeekId}`);
    }
  }

  /**
   * Execute auto-join for a specific game week
   */
  static async executeAutoJoin(gameWeekId: string, triggerType: "automatic" | "manual" = "automatic", triggeredBy?: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const startTime = Date.now();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    const detailedErrors: Array<{
      user_id?: string;
      user_name?: string;
      user_contact?: string;
      error_message: string;
    }> = [];
    
    let alreadyJoinedCount = 0;

    try {
      console.log(`🔄 Executing auto-join for game week: ${gameWeekId}`);

      // Get game week details
      const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
      if (!gameWeek) {
        const errorMsg = `Game week not found: ${gameWeekId}`;
        results.errors.push(errorMsg);
        detailedErrors.push({ error_message: errorMsg });
        
        // Save log to database
        await AutoJoinLogDAL.createLog({
          game_week_id: gameWeekId,
          game_week: 'Unknown',
          trigger_type: triggerType,
          trigger_by: triggeredBy,
          executed_at: new Date(),
          status: 'failed',
          total_users: 0,
          successful_joins: 0,
          failed_joins: 1,
          already_joined: 0,
          error_details: detailedErrors,
          execution_time_ms: Date.now() - startTime,
        });
        
        return results;
      }

      // Check if game week is still active
      if (gameWeek.is_done) {
        const errorMsg = `Game week is already completed: ${gameWeek.game_week}`;
        results.errors.push(errorMsg);
        detailedErrors.push({ error_message: errorMsg });
        
        // Save log to database
        await AutoJoinLogDAL.createLog({
          game_week_id: gameWeekId,
          game_week: gameWeek.game_week || 'Unknown',
          trigger_type: triggerType,
          trigger_by: triggeredBy,
          executed_at: new Date(),
          status: 'failed',
          total_users: 0,
          successful_joins: 0,
          failed_joins: 1,
          already_joined: 0,
          error_details: detailedErrors,
          execution_time_ms: Date.now() - startTime,
        });
        
        return results;
      }

      // Get all active clients who haven't joined this game week
      const clients = await Client.getAllClients();
      console.log(`👥 Found ${clients.length} active clients`);

      for (const client of clients) {
        try {
          // Check if client already joined this game week
          const existingTeam = await GameWeekTeam.getByGameWeekAndClientId({
            game_week_id: gameWeekId,
            client_id: client._id
          });

          if (existingTeam) {
            alreadyJoinedCount++;
            console.log(`⏭️ Client ${client._id} already joined game week ${gameWeek.game_week}`);
            continue;
          }

          // Get client's team
          const team = await Team.getTeamByClientID(client._id);
          if (!team) {
            results.failed++;
            const userName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown User';
            const userContact = client.phone_number || client.email || client._id;
            const errorMsg = `No team found. User hasn't created a team yet.`;
            results.errors.push(`❌ ${userName} (${userContact}) - ${errorMsg}`);
            detailedErrors.push({
              user_id: client._id,
              user_name: userName,
              user_contact: userContact,
              error_message: errorMsg
            });
            continue;
          }

          // Create game week team entry
          const gameWeekTeam = await GameWeekTeam.createGameWeekTeam({
            game_week_id: gameWeekId,
            client_id: client._id,
            team_id: team._id,
            players: team.players,
            cid: team.competition
          });

          if (gameWeekTeam) {
            results.success++;
            console.log(`✅ Auto-joined client ${client._id} to game week ${gameWeek.game_week}`);
          } else {
            results.failed++;
            const userName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown User';
            const userContact = client.phone_number || client.email || client._id;
            const errorMsg = `Failed to create game week team entry.`;
            results.errors.push(`❌ ${userName} (${userContact}) - ${errorMsg}`);
            detailedErrors.push({
              user_id: client._id,
              user_name: userName,
              user_contact: userContact,
              error_message: errorMsg
            });
          }
        } catch (error) {
          results.failed++;
          const userName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown User';
          const userContact = client.phone_number || client.email || client._id;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`❌ ${userName} (${userContact}) - ${errorMessage}`);
          detailedErrors.push({
            user_id: client._id,
            user_name: userName,
            user_contact: userContact,
            error_message: errorMessage
          });
          console.error(`❌ Error auto-joining client ${client._id}:`, error);
        }
      }

      const executionTime = Date.now() - startTime;
      console.log(`🎯 Auto-join completed for game week ${gameWeek.game_week}: ${results.success} success, ${results.failed} failed, ${alreadyJoinedCount} already joined`);
      
      // Determine status
      let status: "success" | "partial" | "failed" = "success";
      if (results.success === 0 && results.failed > 0) {
        status = "failed";
      } else if (results.failed > 0) {
        status = "partial";
      }
      
      // Save log to database
      try {
        await AutoJoinLogDAL.createLog({
          game_week_id: gameWeekId,
          game_week: gameWeek.game_week || 'Unknown',
          trigger_type: triggerType,
          trigger_by: triggeredBy,
          executed_at: new Date(),
          status,
          total_users: clients.length,
          successful_joins: results.success,
          failed_joins: results.failed,
          already_joined: alreadyJoinedCount,
          error_details: detailedErrors,
          execution_time_ms: executionTime,
        });
        console.log(`✅ Auto-join log saved to database`);
      } catch (logError) {
        console.error(`❌ Failed to save auto-join log to database:`, logError);
      }
      
      // Record completed job before cancelling (in-memory for backward compatibility)
      this.completedJobs.set(gameWeekId, {
        gameWeekId,
        executedAt: new Date(),
        results,
        gameWeek: gameWeek.game_week
      });
      
      // Cancel the job after execution
      this.cancelAutoJoinJob(gameWeekId);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMsg = `Auto-join execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMsg);
      detailedErrors.push({ error_message: errorMsg });
      console.error(`❌ Auto-join execution failed for game week ${gameWeekId}:`, error);
      
      // Save failed execution log to database
      try {
        await AutoJoinLogDAL.createLog({
          game_week_id: gameWeekId,
          game_week: 'Unknown',
          trigger_type: triggerType,
          trigger_by: triggeredBy,
          executed_at: new Date(),
          status: 'failed',
          total_users: 0,
          successful_joins: 0,
          failed_joins: 1,
          already_joined: 0,
          error_details: detailedErrors,
          execution_time_ms: executionTime,
        });
      } catch (logError) {
        console.error(`❌ Failed to save auto-join error log to database:`, logError);
      }
    }

    return results;
  }

  /**
   * Get all scheduled auto-join jobs
   */
  static getScheduledJobs(): Array<{ 
    gameWeekId: string; 
    nextInvocation: Date | null;
    status: 'scheduled' | 'completed';
    executedAt?: Date;
    results?: { success: number; failed: number; errors: string[] };
    gameWeek?: string;
  }> {
    const jobs: Array<{ 
      gameWeekId: string; 
      nextInvocation: Date | null;
      status: 'scheduled' | 'completed';
      executedAt?: Date;
      results?: { success: number; failed: number; errors: string[] };
      gameWeek?: string;
    }> = [];
    
    // Add scheduled jobs
    for (const [gameWeekId, job] of this.jobs.entries()) {
      jobs.push({
        gameWeekId,
        nextInvocation: job.nextInvocation(),
        status: 'scheduled'
      });
    }

    // Add completed jobs
    for (const [gameWeekId, completedJob] of this.completedJobs.entries()) {
      jobs.push({
        gameWeekId,
        nextInvocation: null,
        status: 'completed',
        executedAt: completedJob.executedAt,
        results: completedJob.results,
        gameWeek: completedJob.gameWeek
      });
    }

    return jobs;
  }

  /**
   * Cancel all auto-join jobs
   */
  static cancelAllJobs(): void {
    for (const [gameWeekId, job] of this.jobs.entries()) {
      job.cancel();
      console.log(`🗑️ Cancelled auto-join job for game week: ${gameWeekId}`);
    }
    this.jobs.clear();
  }

  /**
   * Clear old completed jobs (older than 7 days)
   */
  static clearOldCompletedJobs(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let clearedCount = 0;
    for (const [gameWeekId, completedJob] of this.completedJobs.entries()) {
      if (completedJob.executedAt < sevenDaysAgo) {
        this.completedJobs.delete(gameWeekId);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} old completed auto-join jobs`);
    }
  }

  /**
   * Reschedule all auto-join jobs (useful when settings change)
   */
  static async rescheduleAllJobs(): Promise<void> {
    console.log(`🔄 Rescheduling all auto-join jobs...`);
    
    // Clear old completed jobs first
    this.clearOldCompletedJobs();
    
    // Cancel all existing jobs
    this.cancelAllJobs();

    // Get all active game weeks
    const gameWeeks = await GameWeek.getAllGameWeeks({});
    
    // Schedule jobs for each game week
    for (const gameWeek of gameWeeks) {
      await this.scheduleAutoJoinJob(gameWeek);
    }

    console.log(`✅ Rescheduled ${gameWeeks.length} auto-join jobs`);
  }
}

export default AutoJoinJobManager;
