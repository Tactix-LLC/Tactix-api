import { Document } from "mongoose";

export default interface IFeedbackTitleDoc extends Document {
  title: string;
  status: string;
  major: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace FeedbackTitleRequest {
    interface ICreateFeedbackTitleInput {
      title: string;
      major?: boolean;
    }

    interface IUpdateFeedbackTitleInput {
      title: string;
    }
    interface IUpdateFeedbackStatusInput {
      status: string;
    }
    interface IDeleteAllFeedbackTitlesInput {
      delete_key: string;
    }
  }
}
