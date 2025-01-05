import { Document } from "mongoose";

export default interface IFeedbackDoc extends Document {
  title: string;
  content: string;
  read_status: boolean;
  first_read_by: String;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace FeedbackRequest {
    interface ICreateFeedkbackInput {
      title_id: string;
      content: string;
    }
    interface IDeleteAllFeedbacksInput {
      delete_key: string;
    }
  }
}
