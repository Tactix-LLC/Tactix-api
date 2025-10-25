import AutoJoinLogModel from "./model";
import IAutoJoinLogDoc from "./dto";

export default class AutoJoinLogDAL {
  /**
   * Create a new auto-join log entry
   */
  static async createLog(data: {
    game_week_id: string;
    game_week: string;
    trigger_type: "automatic" | "manual";
    trigger_by?: string;
    executed_at: Date;
    status: "success" | "partial" | "failed";
    total_users: number;
    successful_joins: number;
    failed_joins: number;
    already_joined: number;
    error_details: Array<{
      user_id?: string;
      user_name?: string;
      user_contact?: string;
      error_message: string;
    }>;
    execution_time_ms: number;
  }): Promise<IAutoJoinLogDoc> {
    return await AutoJoinLogModel.create(data);
  }

  /**
   * Get all auto-join logs with optional filters
   */
  static async getAllLogs(filters: {
    game_week_id?: string;
    trigger_type?: "automatic" | "manual";
    status?: "success" | "partial" | "failed";
    limit?: number;
    skip?: number;
  } = {}): Promise<IAutoJoinLogDoc[]> {
    const query: any = {};

    if (filters.game_week_id) {
      query.game_week_id = filters.game_week_id;
    }

    if (filters.trigger_type) {
      query.trigger_type = filters.trigger_type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    return await AutoJoinLogModel.find(query)
      .populate("game_week_id", "game_week first_match_start_date")
      .populate("trigger_by", "first_name last_name email")
      .sort({ executed_at: -1 })
      .limit(filters.limit || 100)
      .skip(filters.skip || 0);
  }

  /**
   * Get auto-join log by ID
   */
  static async getLogById(id: string): Promise<IAutoJoinLogDoc | null> {
    return await AutoJoinLogModel.findById(id)
      .populate("game_week_id", "game_week first_match_start_date")
      .populate("trigger_by", "first_name last_name email");
  }

  /**
   * Get logs for a specific game week
   */
  static async getLogsByGameWeek(gameWeekId: string): Promise<IAutoJoinLogDoc[]> {
    return await AutoJoinLogModel.find({ game_week_id: gameWeekId })
      .populate("trigger_by", "first_name last_name email")
      .sort({ executed_at: -1 });
  }

  /**
   * Get statistics for auto-join logs
   */
  static async getStatistics(): Promise<{
    total_executions: number;
    total_successful: number;
    total_partial: number;
    total_failed: number;
    total_users_joined: number;
    average_execution_time: number;
  }> {
    const stats = await AutoJoinLogModel.aggregate([
      {
        $group: {
          _id: null,
          total_executions: { $sum: 1 },
          total_successful: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
          },
          total_partial: {
            $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] },
          },
          total_failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          total_users_joined: { $sum: "$successful_joins" },
          average_execution_time: { $avg: "$execution_time_ms" },
        },
      },
    ]);

    return stats[0] || {
      total_executions: 0,
      total_successful: 0,
      total_partial: 0,
      total_failed: 0,
      total_users_joined: 0,
      average_execution_time: 0,
    };
  }

  /**
   * Delete old logs (older than specified days)
   */
  static async deleteOldLogs(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await AutoJoinLogModel.deleteMany({
      executed_at: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  }
}

