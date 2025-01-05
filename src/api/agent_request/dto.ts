import { Document } from "mongoose";

export default interface IAgentRequestDoc extends Document {
  client_id: string;
  facebook_link: string;
  tiktok_link: string;
  instagram_link: string;
  current_job: string;
  user_traction: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  cancel_reason: string;
}

declare global {
  namespace AgentRequest {
    interface ICreateRequest {
      facebook_link: string;
      tiktok_link: string;
      instagram_link: string;
      current_job: string;
      user_traction: number;
    }
    interface IUpdateAgentRequestStatus {
      status: string;
      cancel_reason: string;
    }
    interface IDeleteAllAgentRequests {
      delete_key: string;
    }
    interface IUpdateCreditAgents {
      amount: number;
    }
  }
}
