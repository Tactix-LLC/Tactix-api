import { Document } from "mongoose";

// Structur for the Pol_Response model
export default interface IPollResponseDoc extends Document {
  poll_id: string;
  user_id: string;
  choice_id: string;
}

// Structure of data in different incoming requests
declare global {
  namespace PollResRequests {
    interface ICreateInput {
      poll_id: string;
      user_id: string;
      choice_id: string;
    }
  }
}
