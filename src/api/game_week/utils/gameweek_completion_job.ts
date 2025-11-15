import { fork } from "child_process";
import { join } from "path";
import GameWeek from "../dal";
import GameWeekTeam from "../../game_week_team/dal";
import calculate_fantasy_points from "../../team/utils/calculate_fantasy_points";
import calculate_points from "../utils/calculate_points";
import TeamDAL from "../../team/dal";

interface JobStatus {
  gameWeekId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

class GameWeekCompletionJobManager {
  private static jobs: Map<string, JobStatus> = new Map();

  /**
   * Start a background job to mark a game week as done and calculate points
   */
  static async startCompletionJob(gameWeekId: string): Promise<void> {
    console.log(`🚀 [GameWeekCompletionJob] Starting completion job for game week: ${gameWeekId}`);

    // Initialize job status
    this.jobs.set(gameWeekId, {
      gameWeekId,
      status: 'pending',
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
      },
      startedAt: new Date(),
    });

    // Run the job in the background (don't await)
    this.executeCompletionJob(gameWeekId).catch((error) => {
      console.error(`❌ [GameWeekCompletionJob] Fatal error in completion job for ${gameWeekId}:`, error);
      this.updateJobStatus(gameWeekId, {
        status: 'failed',
        error: error.message || 'Unknown error occurred',
        completedAt: new Date(),
      });
    });
  }

  /**
   * Execute the completion job
   */
  private static async executeCompletionJob(gameWeekId: string): Promise<void> {
    try {
      console.log(`📊 [GameWeekCompletionJob] Executing completion for game week: ${gameWeekId}`);

      // Update status to processing
      this.updateJobStatus(gameWeekId, { status: 'processing' });

      // Get the game week
      const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
      if (!gameWeek) {
        throw new Error('Game week not found');
      }

      // Get the number of teams who joined the gameweek
      const count = await GameWeekTeam.countClientsInGameWeek(gameWeek._id);

      console.log(`👥 [GameWeekCompletionJob] Total teams to process: ${count}`);

      // Update total in progress
      this.updateJobStatus(gameWeekId, {
        progress: {
          current: 0,
          total: count,
          percentage: 0,
        },
      });

      // If there are teams to process
      if (count > 0) {
        // Calculate number of pages
        let page = Math.floor(count / 10);
        if (count % 10 !== 0) {
          page += 1;
        }

        // Get player stats
        const playerStats = await GameWeek.getPlayerStat(gameWeek._id);
        if (!playerStats) {
          throw new Error('Cannot fetch player stat data');
        }

        const parsedPlayerStats = JSON.parse(playerStats);
        let processedCount = 0;

        // Process teams page by page
        for (let i = 1; i <= page; i++) {
          console.log(`📄 [GameWeekCompletionJob] Processing page ${i}/${page}`);

          const gameWeekTeams = await GameWeekTeam.getGameweekTeamsForPoint(
            gameWeek._id,
            i
          );

          // Process all teams in this page
          const updatePromises = gameWeekTeams.map(async (gameWeekTeam) => {
            try {
              // Calculate player points
              const playersPoints = await calculate_fantasy_points(
                gameWeekTeam.players,
                parsedPlayerStats
              );

              const { totalPoint, players } = await calculate_points(playersPoints);

              // Update the team with the latest points
              await GameWeekTeam.updateTotalGameWeekPointAndPlayers({
                id: gameWeekTeam._id,
                total_point: totalPoint,
                players: players,
              });

              // Calculate cumulative total fantasy points across all completed game weeks
              const cumulativeTotal = await this.calculateCumulativeTeamPoints(gameWeekTeam.team_id);

              // Update players on team with cumulative total
              await TeamDAL.updateFantasyPointAndPlayers({
                id: gameWeekTeam.team_id,
                total_fantasy_point: cumulativeTotal,
              });

              processedCount++;

              // Update progress
              const percentage = Math.floor((processedCount / count) * 100);
              this.updateJobStatus(gameWeekId, {
                progress: {
                  current: processedCount,
                  total: count,
                  percentage,
                },
              });

              if (processedCount % 10 === 0) {
                console.log(`⏳ [GameWeekCompletionJob] Progress: ${processedCount}/${count} (${percentage}%)`);
              }
            } catch (error) {
              console.error(`❌ [GameWeekCompletionJob] Error processing team ${gameWeekTeam._id}:`, error);
              // Continue processing other teams even if one fails
            }
          });

          // Wait for all teams in this page to be processed
          await Promise.all(updatePromises);
        }

        console.log(`✅ [GameWeekCompletionJob] All teams processed: ${processedCount}/${count}`);
      }

      // Mark the game week as done
      await GameWeek.updateToDone({
        id: gameWeekId,
        is_done: true,
      });

      // Update job status to completed
      this.updateJobStatus(gameWeekId, {
        status: 'completed',
        completedAt: new Date(),
        progress: {
          current: count,
          total: count,
          percentage: 100,
        },
      });

      console.log(`🎉 [GameWeekCompletionJob] Completion job finished successfully for game week: ${gameWeekId}`);
    } catch (error: any) {
      console.error(`❌ [GameWeekCompletionJob] Error in completion job for ${gameWeekId}:`, error);
      throw error;
    }
  }

  /**
   * Helper function to calculate cumulative team points across all completed game weeks
   */
  private static async calculateCumulativeTeamPoints(teamId: string): Promise<number> {
    try {
      // Get all game week teams for this team across all game weeks
      const allGameWeekTeams = await GameWeekTeam.getByTeamId(teamId);
      
      let cumulativeTotal = 0;
      
      for (const gameWeekTeam of allGameWeekTeams) {
        // Only include points from completed game weeks
        const gameWeek = await GameWeek.getGameWeekById(gameWeekTeam.game_week_id);
        if (gameWeek && gameWeek.is_done) {
          cumulativeTotal += gameWeekTeam.total_fantasy_point || 0;
        }
      }
      
      return cumulativeTotal;
    } catch (error) {
      console.error('Error calculating cumulative team points:', error);
      return 0;
    }
  }

  /**
   * Update job status
   */
  private static updateJobStatus(gameWeekId: string, updates: Partial<JobStatus>): void {
    const currentStatus = this.jobs.get(gameWeekId);
    if (currentStatus) {
      this.jobs.set(gameWeekId, {
        ...currentStatus,
        ...updates,
        progress: {
          ...currentStatus.progress,
          ...(updates.progress || {}),
        },
      });
    }
  }

  /**
   * Get job status
   */
  static getJobStatus(gameWeekId: string): JobStatus | null {
    return this.jobs.get(gameWeekId) || null;
  }

  /**
   * Get all jobs
   */
  static getAllJobs(): JobStatus[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clear completed/failed jobs older than 24 hours
   */
  static cleanupOldJobs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [gameWeekId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < oneDayAgo
      ) {
        this.jobs.delete(gameWeekId);
        console.log(`🧹 [GameWeekCompletionJob] Cleaned up old job for game week: ${gameWeekId}`);
      }
    }
  }
}

export default GameWeekCompletionJobManager;

