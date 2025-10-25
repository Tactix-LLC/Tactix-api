import { Document } from "mongoose";

export default interface IAutoJoinLogDoc extends Document {
  game_week_id: string;
  game_week: string;
  trigger_type: "automatic" | "manual";
  trigger_by?: string; // Admin ID if manual trigger
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
  execution_time_ms: number; // How long it took to execute
  created_at: Date;
  updated_at: Date;
}

