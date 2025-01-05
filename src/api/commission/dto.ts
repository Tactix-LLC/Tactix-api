import { Document } from "mongoose";

export default interface ICommissionDoc extends Document {
  client_id: string;
  agent_id: string;
  amount: number;
  is_paid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces for incoming requests
declare global {
  namespace CommissionRequest {
    interface ICreateCommissionInput {
      agent_id: string;
    }
  }
}
